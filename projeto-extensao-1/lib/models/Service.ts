import mongoose, { Document, Schema, Model } from "mongoose";

export interface IService extends Document {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: [true, "Nome do serviço é obrigatório"],
      trim: true,
      maxlength: [100, "Nome deve ter no máximo 100 caracteres"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Descrição deve ter no máximo 300 caracteres"],
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duração do serviço é obrigatória"],
      min: [10, "Duração mínima é de 10 minutos"],
      max: [480, "Duração máxima é de 480 minutos (8h)"],
    },
    price: {
      type: Number,
      required: [true, "Preço é obrigatório"],
      min: [0, "Preço não pode ser negativo"],
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

const Service: Model<IService> =
  mongoose.models.Service ?? mongoose.model<IService>("Service", ServiceSchema);

export default Service;
