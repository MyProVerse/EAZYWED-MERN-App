import twilio from "twilio"
import { TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE, NODE_ENV } from "../config/env.js"

const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN)

export const sendOTP = async (phone, otp) => {
  if (NODE_ENV === "development") {
    console.log(`Mock SMS to ${phone}: Your OTP is ${otp}`)
    return
  }
  await client.messages.create({
    body: `Your EazyWed OTP is ${otp}`,
    from: TWILIO_PHONE,
    to: phone,
  })
}
