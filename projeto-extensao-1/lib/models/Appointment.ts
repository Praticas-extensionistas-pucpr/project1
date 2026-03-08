import mongoose, { Document, Schema, Model, Types } from "mongoose";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface IAppointment extends Document {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientNotes?: string;
  barberId: Types.ObjectId;
  serviceId: Types.ObjectId;
  date: string;       // formato "YYYY-MM-DD"
  timeSlot: string;   // formato "HH:MM"
  endTime: string;    // formato "HH:MM" calculado a partir do serviço
  status: AppointmentStatus;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    clientName: {
      type: String,
      required: [true, "Nome do cliente é obrigatório"],
      trim: true,
      maxlength: [100, "Nome deve ter no máximo 100 caracteres"],
    },
    clientPhone: {
      type: String,
      required: [true, "Telefone do cliente é obrigatório"],
      trim: true,
    },
    clientEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Formato de e-mail inválido"],
    },
    clientNotes: {
      type: String,
      trim: true,
      maxlength: [300, "Observações devem ter no máximo 300 caracteres"],
    },
    barberId: {
      type: Schema.Types.ObjectId,
      ref: "Barber",
      required: [true, "Barbeiro é obrigatório"],
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: [true, "Serviço é obrigatório"],
    },
    date: {
      type: String,
      required: [true, "Data é obrigatória"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"],
    },
    timeSlot: {
      type: String,
      required: [true, "Horário é obrigatório"],
      match: [/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:MM"],
    },
    endTime: {
      type: String,
      required: [true, "Horário de término é obrigatório"],
      match: [/^\d{2}:\d{2}$/, "Horário de término deve estar no formato HH:MM"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "cancelled", "completed"],
        message: "Status inválido",
      },
      default: "pending",
    },
    cancelReason: {
      type: String,
      trim: true,
      maxlength: [300, "Motivo deve ter no máximo 300 caracteres"],
    },
  },
  {
    timestamps: true,
  }
);

// Índice composto para garantir que não haja dois agendamentos no mesmo slot
AppointmentSchema.index(
  { barberId: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "confirmed"] } },
  }
);

const Appointment: Model<IAppointment> =
  mongoose.models.Appointment ??
  mongoose.model<IAppointment>("Appointment", AppointmentSchema);

export default Appointment;
