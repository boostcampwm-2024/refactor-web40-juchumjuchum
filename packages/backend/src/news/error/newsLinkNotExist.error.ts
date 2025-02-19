export class NewsLinkNotExistException extends Error {
  constructor(message: string) {
    super('News Link Not Exist: 요약할 뉴스가 없어요. ' + message);
  }
}