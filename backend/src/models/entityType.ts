import { Schema, model, Types, Document } from 'mongoose';

export interface IEntityType extends Document {
    _id: Types.ObjectId;
    name: string;
    workspace: Types.ObjectId;
}

const entityTypeSchema = new Schema<IEntityType>(
    {
        name: {
            type: String,
            required: true
        },
        workspace: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true
        }
    }
);

const EntityType = model<IEntityType>('EntityType', entityTypeSchema);

export default EntityType;
