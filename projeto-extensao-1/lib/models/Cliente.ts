import mongoose, { Document, Schema, Model, Types } from "mongoose";

export interface ICliente extends Document {
  barberId: Types.ObjectId;
  nome: string;
  telefone: string;
  dataNascimento?: Date;
  observacoes?: string;
  ultimoCorte?: Date;
  totalServicos: number;
  servicosFavoritos: string[];
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClienteSchema = new Schema<ICliente>(
  {
    barberId: {
      type: Schema.Types.ObjectId,
      ref: "Barber",
      required: true,
      index: true,
    },
    nome: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
      maxlength: 100,
    },
    telefone: {
      type: String,
      required: [true, "Telefone é obrigatório"],
      trim: true,
    },
    dataNascimento: { type: Date },
    observacoes: { type: String, trim: true, maxlength: 500 },
    ultimoCorte: { type: Date },
    totalServicos: { type: Number, default: 0, min: 0 },
    servicosFavoritos: { type: [String], default: [] },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ClienteSchema.index({ barberId: 1, nome: 1 });

const Cliente: Model<ICliente> =
  mongoose.models.Cliente ?? mongoose.model<ICliente>("Cliente", ClienteSchema);

export default Cliente;
