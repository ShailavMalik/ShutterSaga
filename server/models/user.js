/**
 * User Model
 * Defines the schema for user accounts with password hashing
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true, // Always store emails in lowercase
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    avatarUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

/**
 * Pre-save hook to hash password before storing
 * Only runs if the password field was modified
 */
userSchema.pre("save", async function () {
  // Skip hashing if password wasn't changed
  if (!this.isModified("password")) return;

  // Generate salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method to compare passwords during login
 * @param {string} candidatePassword - The password to check
 * @returns {boolean} - True if passwords match
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
