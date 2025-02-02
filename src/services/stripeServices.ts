import User from "@models/userModel";
import Event from "@models/eventModel";
import to from "await-to-ts";
import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhook = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const sig = req.headers["stripe-signature"]!;

  try {
    const webhook_event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    let error, user, event, eventHost;
    if (webhook_event.type === "account.updated") {
      const account = webhook_event.data.object as Stripe.Account;
      const stripeAccountId = account.id;
      [error, user] = await to(User.findOne({ stripeAccountId }));
      if (error) throw error;
      if (!user) throw createError(StatusCodes.NOT_FOUND, "User not found");

      if (account.details_submitted && account.charges_enabled) {
        user.stripeAccoutStatus = true;
        [error] = await to(user.save());
        if (error) throw error;
      }
    }

    if (webhook_event.type === "payment_intent.succeeded") {
      const paymentIntent = webhook_event.data.object as Stripe.PaymentIntent;

      const quantity = paymentIntent.metadata.quantity;
      const userId = paymentIntent.metadata.userId;
      const eventId = paymentIntent.metadata.eventId;

      console.log(`Payment succeeded for userId: ${userId}, eventId: ${eventId}`);

      [error, user] = await to(User.findById(userId));
      if (error) throw error;
      if (!user) {
        console.error(`User not found for ID: ${userId}`);
        return res.status(StatusCodes.OK).send();
      }

      [error, event] = await to(Event.findById(eventId));
      if (error) throw error;
      if (!event) {
        console.error(`Event not found for ID: ${eventId}`);
        return res.status(StatusCodes.OK).send();
      }

      [error, eventHost] = await to(User.findById(event.host));
      if (error) throw error;
      if (!eventHost) {
        console.error(`Event host not found for ID: ${event.host}`);
        return res.status(StatusCodes.OK).send();
      }

      const ticket = {
        event: event._id as Types.ObjectId,
        title: event.title,
        description: event.description,
        location: event.map.location!,
        date: event.date,
        quantity: Number.parseInt(quantity),
        customId: uuidv4(),
      };
      user.tickets?.push(ticket);

      const guest = {
        user: new Types.ObjectId(userId),
        event: new Types.ObjectId(eventId),
        name: user.name,
        avatar: user.avatar,
        quantity: Number.parseInt(quantity),
        eventTitle: event.title,
        location: event.map.location!,
      };
      eventHost.guests?.push(guest);

      await Promise.all([
        user.save(),
        eventHost.save(),
        Event.updateOne({ _id: eventId }, { $inc: { ticketSell: 1 } }),
      ]);
    }

    res.status(StatusCodes.OK).send();
  } catch (error: any) {
    console.log(error);
    next(error);
  }
};

const StripeServices = {
  webhook,
};

export default StripeServices;
