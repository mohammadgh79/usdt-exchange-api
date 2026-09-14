import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';


/**
 * Shape of a user document in TypeScript.
 *
 * @property {string} name - User's display name.
 * @property {string} email - User's email, used for login (must be unique).
 * @property {string} password - Hashed password (never stored in plain text).
 * @property {'user' | 'admin'} role - Access level; defaults to 'user'.
 */
interface IUser {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// Hashes the password before saving, but only if it was newly set or changed.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});



userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};
export const User = model<IUser>('User', userSchema);
