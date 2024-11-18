import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChatType } from '@/chat/domain/chatType.enum';
import { Like } from '@/chat/domain/like.entity';
import { DateEmbedded } from '@/common/dateEmbedded.entity';
import { Stock } from '@/stock/domain/stock.entity';
import { User } from '@/user/domain/user.entity';

@Entity()
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Stock, (stock) => stock.id)
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @OneToMany(() => Like, (like) => like.chat)
  likes?: Like[];

  @Column()
  message: string;

  @Column({ type: 'enum', enum: ChatType, default: ChatType.NORMAL })
  type: ChatType = ChatType.NORMAL;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number = 0;

  @Column(() => DateEmbedded, { prefix: '' })
  date: DateEmbedded;
}
