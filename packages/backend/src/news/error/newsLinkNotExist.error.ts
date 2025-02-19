export class NewsLinkNotExistException extends Error {
  constructor(message: string) {
    super('News Link Not Exist: ' + message);
  }
}