import mongoose from "mongoose";
const {Schema} = mongoose;

const toJSON = {
    virtuals:true,
    versionKey:false,
    transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
    }
}

const baseSchema = new Schema({
    title:{type:String,required:true, trim:true,maxLength:200},
    consumed:{type:Boolean, default:false},
    tags:{type:[String],default:[]},
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      }
    },
    {
      timestamps: { createdAt: 'addedAt', updatedAt: 'updatedAt' },
      discriminatorKey: 'kind',          // ← THE magic field
      collection: 'libraryitems',
      toJSON,
    }
)

 export const LibraryItem = mongoose.model('LibraryItem', baseSchema);


  export const Book = LibraryItem.discriminator(
    'book',
    new Schema(
      {
        author: { type: String, required: true },
        pages: { type: Number, required: true, min: 1 },
      },
      { toJSON },
    ),
  );

  export const Podcast = LibraryItem.discriminator(
    'podcast',
    new Schema(
      {
        host: { type: String, required: true },
        durationMinutes: { type: Number, required: true, min: 1 },
      },
      { toJSON },
    ),
  );

  export const Article = LibraryItem.discriminator(
    'article',
    new Schema(
      {
        url: { type: String, required: true },
        source: { type: String, required: true },
      },
      { toJSON },
    ),
  );

  export const VARIANTS = { book: Book, podcast: Podcast, article: Article };
