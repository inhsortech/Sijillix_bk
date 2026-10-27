const cron = require("node-cron");
const Document = require("../models/Document");
const Task = require("../models/Task");
function startExpiryJob() {
  cron.schedule("0 8 * * *", async () => {
    try {
      const today = new Date(); today.setHours(0,0,0,0); const deadline = new Date(today); deadline.setDate(deadline.getDate()+30);
      const docs = await Document.find({ expiryDate: { $gte: today, $lte: deadline } });
      for (const doc of docs) {
        await Task.updateOne({ organizationId: doc.organizationId, documentId: doc._id, status: { $ne: "completed" } }, { $setOnInsert: { organizationId: doc.organizationId, documentId: doc._id, title: `Renew document: ${doc.title}`, description: "Document expiry is approaching.", dueDate: doc.expiryDate, priority: "high", status: "open" } }, { upsert: true });
      }
      console.log("Expiry check completed");
    } catch (err) { console.error("Expiry job failed:", err.message); }
  });
}
module.exports = startExpiryJob;
