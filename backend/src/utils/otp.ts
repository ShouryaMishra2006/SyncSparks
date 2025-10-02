export const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = Date.now() + 60 * 1000 // 1min 
  return { otp, expiresAt }
}
