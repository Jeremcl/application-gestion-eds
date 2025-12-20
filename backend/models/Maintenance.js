const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  isActive: {
    type: Boolean,
    default: false
  },
  endDate: {
    type: Date,
    required: function() {
      return this.isActive;
    }
  },
  message: {
    type: String,
    default: 'L\'application est actuellement en maintenance. Veuillez réessayer plus tard.'
  }
}, {
  timestamps: true
});

// S'assurer qu'il n'y a qu'un seul document de maintenance
maintenanceSchema.statics.getMaintenance = async function() {
  let maintenance = await this.findOne();
  if (!maintenance) {
    maintenance = await this.create({ isActive: false });
  }
  return maintenance;
};

module.exports = mongoose.model('Maintenance', maintenanceSchema);

