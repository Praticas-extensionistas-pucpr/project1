import mongoose, { Document, Schema, Model, Types } from "mongoose";

export type CategoriaProduto = "insumo" | "venda";
export type UnidadeProduto = "unidade" | "ml" | "g" | "cx" | "pct";

export interface IProduto extends Document {
  barberId: Types.ObjectId;
  nome: string;
  categoria: CategoriaProduto;
  unidade: UnidadeProduto;
  quantidade: number;
  quantidadeMinima: number;
  precoCusto?: number;
  precoVenda?: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProdutoSchema = new Schema<IProduto>(
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
    categoria: {
      type: String,
      enum: ["insumo", "venda"],
      required: [true, "Categoria é obrigatória"],
    },
    unidade: {
      type: String,
      enum: ["unidade", "ml", "g", "cx", "pct"],
      default: "unidade",
    },
    quantidade: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    quantidadeMinima: {
      type: Number,
      min: 0,
      default: 1,
    },
    precoCusto: { type: Number, min: 0 },
    precoVenda: { type: Number, min: 0 },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProdutoSchema.index({ barberId: 1, categoria: 1 });

const Produto: Model<IProduto> =
  mongoose.models.Produto ?? mongoose.model<IProduto>("Produto", ProdutoSchema);

export default Produto;
