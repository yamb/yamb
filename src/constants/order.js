export const Order = Object.freeze({
  PublishedDesc: '-publishedAt',
  PublishedAsc: 'publishedAt',
  CreatedDesc: '-createdAt',
  CreatedAsc: 'createdAt',
  UpdatedDesc: '-updatedAt',
  UpdatedAsc: 'updatedAt',
  TitleDesc: '-title',
  TitleAsc: 'title'
});

export const orderValues = Object.freeze(Object.values(Order));
