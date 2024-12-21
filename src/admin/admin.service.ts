/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { Question, User } from '@prisma/client';
import { PaginatedResult, PaginationParams } from 'src/constants/pagination';
import {
  ForumStats,
  MonthlyForumStats,
  MonthlyStats,
  TopContributor,
  TopContributorsResponse,
  UserStats,
} from 'src/constants/Stats';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // async getAllUsers() {
  //   try {
  //     const users = await this.prisma.user.findMany({
  //       select: {
  //         id: true,
  //         email: true,
  //         role: true,
  //         name: true,
  //         createdAt: true,
  //         updatedAt: true,
  //       },
  //       orderBy: {
  //         createdAt: 'desc',
  //       },
  //     });

  //     if (!users || users.length === 0) {
  //       throw new NotFoundException('No users found');
  //     }

  //     return users;
  //   } catch (error) {
  //     throw new NotFoundException('Failed to fetch users');
  //   }
  // }
  async getAllUsers(params: PaginationParams) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async addUser(user: User) {
    const defaultPassword = '123123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    try {
      const addUser = this.prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          role: user.role,
          password: hashedPassword,
        },
      });
      console.log(
        'Added User Successfully',
        user.email + user.name + user.role,
      );
      return addUser;
    } catch (error) {
      console.error('Error added user:', error);
      throw new Error('Could not add user');
    }
  }
  async deleteUser(userId: number) {
    const id = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    try {
      const deletedUser = await this.prisma.user.delete({
        where: {
          id: id,
        },
      });
      console.log(`Deleted user with id: ${id}`);
      return deletedUser;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Could not delete user');
    }
  }
  async updateUser(userId: number, userData: User) {
    try {
      const parsedUserId =
        typeof userId === 'string' ? parseInt(userId, 10) : userId;
      if (isNaN(parsedUserId)) {
        throw new Error('Invalid user ID');
      }
      const updatedUser = await this.prisma.user.update({
        where: { id: parsedUserId },
        data: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
        },
      });
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Could not update user');
    }
  }
  // async getAllQuestions() {
  //   return this.prisma.question.findMany({
  //     include: {
  //       user: true,
  //       answers: {
  //         include: {
  //           user: true,
  //           comments: {
  //             include: {
  //               user: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //     orderBy: { createdAt: 'desc' },
  //   });
  // }
  async getAllQuestions(
    params: PaginationParams,
  ): Promise<PaginatedResult<Question>> {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          answers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
              comments: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.question.count(),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      data: questions,
      meta: {
        total,
        page,
        lastPage,
      },
    };
  }

  async deleteQuestion(id: number) {
    const question = await this.prisma.question.findUnique({ where: { id } });
    if (!question) throw new NotFoundException('Question not found');

    return this.prisma.question.delete({ where: { id } });
  }
  async getAllAnswers() {
    return this.prisma.answer.findMany({
      include: {
        user: true,
        question: true,
        comments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAnswer(id: number) {
    const answer = await this.prisma.answer.findUnique({ where: { id } });
    if (!answer) throw new NotFoundException('Answer not found');

    return this.prisma.answer.delete({ where: { id } });
  }

  async toggleAnswerAcceptance(id: number) {
    const answer = await this.prisma.answer.findUnique({ where: { id } });
    if (!answer) throw new NotFoundException('Answer not found');

    return this.prisma.answer.update({
      where: { id },
      data: { isAccepted: !answer.isAccepted },
    });
  }

  async getAllComments() {
    return this.prisma.comment.findMany({
      include: {
        user: true,
        answer: {
          include: {
            question: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteComment(id: number) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.prisma.comment.delete({ where: { id } });
  }
  async getUserStats(): Promise<UserStats> {
    try {
      const [totalUsers, roleStats] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.groupBy({
          by: ['role'],
          _count: {
            _all: true,
          },
        }),
      ]);

      const monthlyStats = await this.prisma.$queryRaw<MonthlyStats[]>`
        SELECT 
          EXTRACT(MONTH FROM "createdAt")::integer as month,
          EXTRACT(YEAR FROM "createdAt")::integer as year,
          COUNT(*)::integer as "_count"
        FROM "User"
        GROUP BY 
          EXTRACT(MONTH FROM "createdAt"),
          EXTRACT(YEAR FROM "createdAt")
        ORDER BY year DESC, month DESC
        LIMIT 12
      `;

      return {
        total: totalUsers,
        roleDistribution: roleStats.map((stat) => ({
          role: stat.role,
          _count: stat._count._all,
        })),
        monthlyGrowth: monthlyStats,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new InternalServerErrorException('Failed to get user statistics');
    }
  }

  async getForumStats(): Promise<ForumStats> {
    try {
      const [totalStats, rawMonthlyStats] = await Promise.all([
        Promise.all([
          this.prisma.question.count(),
          this.prisma.answer.count(),
          this.prisma.comment.count(),
        ]),
        this.prisma.$queryRaw<MonthlyForumStats[]>`
          SELECT 
            EXTRACT(MONTH FROM date_series)::integer as month,
            EXTRACT(YEAR FROM date_series)::integer as year,
            COALESCE(COUNT(DISTINCT q.id), 0)::integer as questions,
            COALESCE(COUNT(DISTINCT a.id), 0)::integer as answers,
            COALESCE(COUNT(DISTINCT c.id), 0)::integer as comments
          FROM generate_series(
            NOW() - INTERVAL '12 months',
            NOW(),
            INTERVAL '1 month'
          ) as date_series
          LEFT JOIN "Question" q ON 
            EXTRACT(MONTH FROM q."createdAt") = EXTRACT(MONTH FROM date_series) AND
            EXTRACT(YEAR FROM q."createdAt") = EXTRACT(YEAR FROM date_series)
          LEFT JOIN "Answer" a ON 
            EXTRACT(MONTH FROM a."createdAt") = EXTRACT(MONTH FROM date_series) AND
            EXTRACT(YEAR FROM a."createdAt") = EXTRACT(YEAR FROM date_series)
          LEFT JOIN "Comment" c ON 
            EXTRACT(MONTH FROM c."createdAt") = EXTRACT(MONTH FROM date_series) AND
            EXTRACT(YEAR FROM c."createdAt") = EXTRACT(YEAR FROM date_series)
          GROUP BY month, year
          ORDER BY year DESC, month DESC
        `,
      ]);

      const [questions, answers, comments] = totalStats;
      const monthlyStats = rawMonthlyStats || [];

      return {
        total: {
          questions,
          answers,
          comments,
        },
        monthly: monthlyStats,
      };
    } catch (error) {
      console.error('Error getting forum stats:', error);
      throw new InternalServerErrorException('Failed to get forum statistics');
    }
  }
  async getTopContributors(): Promise<TopContributorsResponse> {
    const [topQuestioners, topAnswerers, topCommenters, rawTopOverall] =
      await Promise.all([
        this.prisma.user.findMany({
          take: 5,
          orderBy: {
            questions: { _count: 'desc' },
          },
          select: {
            id: true,
            name: true,
            email: true,
            _count: {
              select: { questions: true },
            },
          },
        }),
        this.prisma.user.findMany({
          take: 5,
          orderBy: {
            answers: { _count: 'desc' },
          },
          select: {
            id: true,
            name: true,
            email: true,
            _count: {
              select: { answers: true },
            },
          },
        }),
        this.prisma.user.findMany({
          take: 5,
          orderBy: {
            comments: { _count: 'desc' },
          },
          select: {
            id: true,
            name: true,
            email: true,
            _count: {
              select: { comments: true },
            },
          },
        }),
        this.prisma.$queryRaw`
        SELECT 
          u.id,
          u.name,
          u.email,
          CAST(COUNT(q.id) AS INTEGER) as questions,
          CAST(COUNT(a.id) AS INTEGER) as answers,
          CAST(COUNT(c.id) AS INTEGER) as comments,
          CAST((COUNT(q.id) + COUNT(a.id) + COUNT(c.id)) AS INTEGER) as total
        FROM "User" u
        LEFT JOIN "Question" q ON q."userId" = u.id
        LEFT JOIN "Answer" a ON a."userId" = u.id
        LEFT JOIN "Comment" c ON c."userId" = u.id
        GROUP BY u.id, u.name, u.email
        ORDER BY (COUNT(q.id) + COUNT(a.id) + COUNT(c.id)) DESC
        LIMIT 5
      `,
      ]);
    // const topOverall = (rawTopOverall as any[]).map((user) => ({
    //   id: user.id,
    //   name: user.name,
    //   email: user.email,
    //   questions: Number(user.questions),
    //   answers: Number(user.answers),
    //   comments: Number(user.comments),
    //   total: Number(user.total),
    // }));
    const topOverall = await this.prisma.$queryRaw<TopContributor[]>`
    SELECT 
      u.id,
      u.name,
      u.email,
      (SELECT COUNT(*) FROM "Question" WHERE "userId" = u.id)::integer as questions,
      (SELECT COUNT(*) FROM "Answer" WHERE "userId" = u.id)::integer as answers,
      (SELECT COUNT(*) FROM "Comment" WHERE "userId" = u.id)::integer as comments,
      (
        (SELECT COUNT(*) FROM "Question" WHERE "userId" = u.id) *5+
        (SELECT COUNT(*) FROM "Answer" WHERE "userId" = u.id) *2+
        (SELECT COUNT(*) FROM "Comment" WHERE "userId" = u.id)
      )::integer as total
    FROM "User" u
    GROUP BY u.id, u.name, u.email
    HAVING (
      (SELECT COUNT(*) FROM "Question" WHERE "userId" = u.id) +
      (SELECT COUNT(*) FROM "Answer" WHERE "userId" = u.id) +
      (SELECT COUNT(*) FROM "Comment" WHERE "userId" = u.id)
    ) > 0
    ORDER BY total DESC
    LIMIT 5
  `;
    return {
      topQuestioners,
      topAnswerers,
      topCommenters,
      // topOverall: topOverall.map((user) => ({
      //   ...user,
      //   questions: Number(user.questions),
      //   answers: Number(user.answers),
      //   comments: Number(user.comments),
      //   total: Number(user.total),
      // })),
      topOverall,
    };
  }

  // admin tìm kiếm người dùng qua tên hoặc email
  async searchUsers(query: string, params: PaginationParams) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({
        where: {
          OR: [
            { email: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
