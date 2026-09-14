import { Schema, model, Types } from 'mongoose';

/**
 * Shape of a wallet document in TypeScript.
 *
 * @property {Types.ObjectId} user - Reference to the owning User document.
 * @property {number} tomanBalance - Cash balance in Toman.
 * @property {number} tetherBalance - Asset balance in Tether (USDT).
 */
interface IWallet {
  user: Types.ObjectId;
  tomanBalance: number;
  tetherBalance: number;
}

const walletSchema = new Schema<IWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    tomanBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    tetherBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Wallet = model<IWallet>('Wallet', walletSchema);