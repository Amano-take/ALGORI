export class AppObject {
  // Mongoのスキーマオプション
  static readonly SCHEMA_OPTIONS = {
    versionKey: false,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
    id: false,
    timestamps: {
      createdAt: 'dateCreated',
      updatedAt: 'dateUpdated',
    },
  };

  // Redisキーのプレフィックス
  static readonly REDIS_PREFIX = {
    DESK: 'desk',
    ROOM: 'room',
    PLAYER: 'player',
  };

  // boolean型の比較時に使用する文字列
  static readonly BOOLEAN = {
    TRUE: 'true',
    FALSE: 'false',
  };
}
