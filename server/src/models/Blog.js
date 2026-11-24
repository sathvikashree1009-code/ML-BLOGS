const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    content: { type: String, required: true }, // markdown
    excerpt: { type: String, default: '' },
    tags: [{ type: String, trim: true, lowercase: true }],
    coverImage: { type: String, default: '' },
    repo: {
      url: { type: String, default: '' },
      name: { type: String, default: '' },
      stars: { type: Number, default: 0 },
      language: { type: String, default: '' },
    },
    status: { type: String, enum: ['draft', 'published', 'scheduled'], default: 'published' },
    publishedAt: { type: Date },
    scheduledFor: { type: Date },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    toxicScore: { type: Number, default: 0 },
    vulnReport: { type: Object, default: null },
  },
  { timestamps: true }
);

blogSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') +
      '-' +
      Date.now().toString(36);
  }
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.replace(/[#*`]/g, '').slice(0, 160);
  }
  next();
});

blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('Blog', blogSchema);