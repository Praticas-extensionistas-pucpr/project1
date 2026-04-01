import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface IAtendimentoCliente extends Document {
  clienteId: Types.ObjectId;
  barberId: Types.ObjectId;
  servico: string;
  preco: number;
  observacoes?: string;
  data: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AtendimentoClienteSchema = new Schema<IAtendimentoCliente>(
  {
    clienteId: {
      type: Schema.Types.ObjectId,
      ref: "Cliente",
      required: true,
      index: true,
    },
    barberId: {
      type: Schema.Types.ObjectId,
      ref: "Barber",
      required: true,
    },
    servico: { type: String, required: true, trim: true },
    preco: { type: Number, required: true, min: 0 },
    observacoes: { type: String, trim: true, maxlength: 300 },
    data: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true }
);

AtendimentoClienteSchema.index({ clienteId: 1, data: -1 });
AtendimentoClienteSchema.index({ barberId: 1, data: -1 });

const AtendimentoCliente: Model<IAtendimentoCliente> =
  mongoose.models.AtendimentoCliente ??
  mongoose.model<IAtendimentoCliente>(
    "AtendimentoCliente",
    AtendimentoClienteSchema
  );

export default AtendimentoCliente;
