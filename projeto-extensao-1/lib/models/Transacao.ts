import mongoose, { Schema, Document, Model } from "mongoose";

export type FormaPagamento = "dinheiro" | "pix" | "debito" | "credito_vista";
export type TipoTransacao = "servico" | "venda_balcao" | "despesa" | "estorno";

export interface ITransacao extends Document {
  barberId: mongoose.Types.ObjectId;
  agendamentoId?: mongoose.Types.ObjectId;
  tipo: TipoTransacao;
  descricao: string;
  valorBruto: number;
  formaPagamento: FormaPagamento;
  taxaPercentual: number;
  valorTaxa: number;
  valorLiquido: number;
  categoria: string;
  criadoEm: Date;
}

const TransacaoSchema = new Schema<ITransacao>(
  {
    barberId: { type: Schema.Types.ObjectId, ref: "Barber", required: true, index: true },
    agendamentoId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    tipo: {
      type: String,
      enum: ["servico", "venda_balcao", "despesa", "estorno"],
      required: true,
    },
    descricao: { type: String, required: true, trim: true },
    valorBruto: { type: Number, required: true, min: 0 },
    formaPagamento: {
      type: String,
      enum: ["dinheiro", "pix", "debito", "credito_vista"],
      required: true,
    },
    taxaPercentual: { type: Number, required: true, default: 0, min: 0 },
    valorTaxa: { type: Number, required: true, default: 0, min: 0 },
    valorLiquido: { type: Number, required: true },
    categoria: { type: String, default: "outros", trim: true },
    criadoEm: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

const Transacao: Model<ITransacao> =
  mongoose.models.Transacao ||
  mongoose.model<ITransacao>("Transacao", TransacaoSchema);

export default Transacao;
