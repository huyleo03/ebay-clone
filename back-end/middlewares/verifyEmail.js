const User = require("../models/user.js");

exports.verifyEmail = async (req, res) => {
  const { token, email } = req.query;

  try {
    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();
    const tokenString = token.toString().trim();

    console.log(`VerifyEmail: email=${normalizedEmail}, token=${tokenString}`);

    const user = await User.findOne({
      email: normalizedEmail,
      verificationToken: tokenString,
    });

    if (!user) {
      console.log(
        `VerifyEmail failed: No user found for email=${normalizedEmail}, token=${tokenString}`
      );
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    if (user.isVerified) {
      console.log(`User already verified: email=${normalizedEmail}`);
      return res.status(400).json({ message: "Email already verified" });
    }

    user.isVerified = true;
    user.verificationToken = null; // Clear the token
    await user.save();

    console.log(`Email verified: email=${normalizedEmail}`);

    // Redirect to login page with success message
    res.redirect("/auth?verified=true");
  } catch (err) {
    console.error("Email verification error:", {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ message: err.message });
  }
};
