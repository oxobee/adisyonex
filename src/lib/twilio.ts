import twilio from "twilio";

type TwilioClient = ReturnType<typeof twilio>;

let client: TwilioClient | null = null;

const getClient = (): TwilioClient | null => {
  const accountSid = process.env.TWILLIO_A_SID;
  const authToken =
    process.env.TWILLIO_PRIMARY_TOKEN ?? process.env.TWILLIO_AUTH_SECRET;
  if (!accountSid || !authToken) {
    return null;
  }
  client ??= twilio(accountSid, authToken);
  return client;
};

/** Send an SMS via Twilio Programmable Messaging. */
export const sendSms = async (to: string, body: string): Promise<void> => {
  const twilioClient = getClient();
  const from = process.env.TWILLIO_FROM_NUMBER;
  if (!twilioClient || !from) {
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.DISABLE_OTP === "true"
    ) {
      console.log(`[SMS DEV LOG] To: ${to} | Message: ${body}`);
      return;
    }
    throw new Error(
      "Twilio credentials (TWILLIO_A_SID / TWILLIO_PRIMARY_TOKEN / TWILLIO_FROM_NUMBER) are not set.",
    );
  }
  await twilioClient.messages.create({ to, from, body });
};
