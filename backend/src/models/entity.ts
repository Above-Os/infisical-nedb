import { Schema, model, Types, Document } from 'mongoose';

export interface IEntity extends Document {
    _id: Types.ObjectId;
    entityType: Types.ObjectId;
    workspace: Types.ObjectId;    
    distinctId: string;
}

const entitySchema = new Schema<IEntity>(
    {
        entityType: {
            type: Schema.Types.ObjectId,
            ref: 'EntityType',
            required: true
        },
        workspace: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true
        },
        distinctId: {
            type: String,
            required: true
        }
    }
);

const Entity = model<IEntity>('Entity', entitySchema);

export default Entity;