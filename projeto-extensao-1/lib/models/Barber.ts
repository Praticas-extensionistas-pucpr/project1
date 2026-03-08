import mongoose, { Document, Schema, Model } from "mongoose";

export interface IBarber extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  bio?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BarberSchema = new Schema<IBarber>(
  {
    name: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
      maxlength: [100, "Nome deve ter no máximo 100 caracteres"],
    },
    email: {
      type: String,
      required: [true, "E-mail é obrigatório"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Formato de e-mail inválido"],
    },
    password: {
      type: String,
      required: [true, "Senha é obrigatória"],
      minlength: [6, "Senha deve ter no mínimo 6 caracteres"],
      select: false, // não retorna a senha nas queries por padrão
    },
    phone: {
      type: String,
      required: [true, "Telefone é obrigatório"],
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Biografia deve ter no máximo 500 caracteres"],
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Barber: Model<IBarber> =
  mongoose.models.Barber ?? mongoose.model<IBarber>("Barber", BarberSchema);

export default Barber;
