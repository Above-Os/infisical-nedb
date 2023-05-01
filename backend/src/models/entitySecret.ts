import { Schema, model, Types, Document } from 'mongoose';

export interface IEntitySecret {
    _id: Types.ObjectId;
    entity: Types.ObjectId;
    type?: string;
    workspace: Types.ObjectId;
    secretBlindIndex: string;
    secretKeyCiphertext: string;
    secretKeyIV: string;
    secretKeyTag: string;
    secretValueCiphertext: string;
    secretValueIV: string;
    secretValueTag: string;
}

const entitySecretSchema = new Schema<IEntitySecret>(
    {
        entity: {
            type: Schema.Types.ObjectId,
            required: true
        },
        type: {
            type: String
        },
        workspace: {
            type: Schema.Types.ObjectId,
            required: true
        },
        secretBlindIndex: {
            type: String,
            required: true
        },
        secretKeyCiphertext: {
            type: String,
            required: true
        },
        secretKeyIV: {
            type: String,
            required: true
        },
        secretKeyTag: {
            type: String,
            required: true
        },
        secretValueCiphertext: {
            type: String,
            required: true
        },
        secretValueIV: {
            type: String,
            required: true
        },
        secretValueTag: {
            type: String,
            required: true
        }
    }
);

const EntitySecret = model<IEntitySecret>('EntitySecret', entitySecretSchema);

export default EntitySecret;