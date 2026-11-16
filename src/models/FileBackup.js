import mongoose from "mongoose";

const FileBackupSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
    },
    pathname: {
      type: String,
      required: true,
      index: true,
    },
    blobUrl: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: String,
      default: "unknown",
    },
    uploadedByRole: {
      type: String,
      default: "admin",
    },
    dateRange: {
      type: String,
      default: "",
    },
    accountsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.FileBackup || mongoose.model("FileBackup", FileBackupSchema);
