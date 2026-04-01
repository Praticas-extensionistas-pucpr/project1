import mongoose, { Schema, Document, Model } from "mongoose";

export interface IConfiguracao extends Document {
  barberId: mongoose.Types.ObjectId;
  taxaDebito: number;
  taxaCreditoVista: number;
  taxaCreditoParcelado: number;
  taxaPix: number;
  taxaDinheiro: number;
}

const ConfiguracaoSchema = new Schema<IConfiguracao>(
  {
    barberId: { type: Schema.Types.ObjectId, ref: "Barber", required: true, unique: true },
    taxaDebito: { type: Number, default: 1.99, min: 0 },
    taxaCreditoVista: { type: Number, default: 2.99, min: 0 },
    taxaCreditoParcelado: { type: Number, default: 3.99, min: 0 },
    taxaPix: { type: Number, default: 0, min: 0 },
    taxaDinheiro: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

const Configuracao: Model<IConfiguracao> =
  mongoose.models.Configuracao ||
  mongoose.model<IConfiguracao>("Configuracao", ConfiguracaoSchema);

export default Configuracao;
