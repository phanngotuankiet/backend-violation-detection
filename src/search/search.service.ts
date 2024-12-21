// // src/search/search.service.ts
// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { WebsocketGateway } from '../websocket/websocket.gateway';
// import {
//   SENSITIVE_KEYWORDS,
//   SensitiveKeywordCategory,
// } from '../constants/sensitiveKeyword';
// import {
//   SearchStatus,
//   SensitiveSearchNotification,
// } from 'src/websocket/websocket.types';

// @Injectable()
// export class SearchService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly websocketGateway: WebsocketGateway,
//     private searchRepository: Repository<SensitiveSearch>,
//   ) {}
//   async searchVideos(searchTerm: string, userId: number) {
//     const sensitiveCheck = await this.checkSensitiveContent(searchTerm, userId);

//     if (sensitiveCheck.isSensitive) {
//       return {
//         isSensitive: true,
//         message: 'This search contains sensitive content',
//         videos: [],
//       };
//     }

//     const videos = await this.prisma.video.findMany({
//       where: {
//         OR: [
//           { title: { contains: searchTerm, mode: 'insensitive' } },
//           { description: { contains: searchTerm, mode: 'insensitive' } },
//         ],
//       },
//       include: {
//         user: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//         predictions: true,
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//     });

//     return {
//       isSensitive: false,
//       videos,
//     };
//   }
//   async checkSensitiveContent(searchTerm: string, userId: number) {
//     const normalizedSearch = searchTerm.toLowerCase();

//     let category: SensitiveKeywordCategory | null = null;
//     for (const [key, keywords] of Object.entries(SENSITIVE_KEYWORDS)) {
//       if (keywords.some((keyword) => normalizedSearch.includes(keyword))) {
//         category = key as SensitiveKeywordCategory;
//         break;
//       }
//     }

//     if (category) {
//       const sensitiveSearch = await this.prisma.sensitiveSearch.create({
//         data: {
//           userId,
//           searchTerm,
//           category,
//           status: 'pending',
//         },
//       });

//       // Notify admins via WebSocket
//       this.websocketGateway.notifyAdmins({
//         type: 'SENSITIVE_SEARCH',
//         searchId: sensitiveSearch.id,
//         searchTerm: sensitiveSearch.searchTerm,
//         category: sensitiveSearch.category,
//         userId: sensitiveSearch.userId,
//       });

//       return {
//         isSensitive: true,
//         category,
//       };
//     }

//     return { isSensitive: false };
//   }

//   async getSensitiveSearches() {
//     return this.prisma.sensitiveSearch.findMany({
//       include: {
//         user: {
//           select: {
//             id: true,
//             email: true,
//             name: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: 'desc',
//       },
//     });
//   }

//   async updateSearchStatus(id: string | number, status: SearchStatus) {
//     try {
//       // Convert id to number and validate
//       const searchId = Number(id);
//       if (isNaN(searchId)) {
//         throw new BadRequestException('Invalid ID format - must be a number');
//       }

//       // Check if search exists
//       const existingSearch = await this.prisma.sensitiveSearch.findUnique({
//         where: { id: searchId },
//       });

//       if (!existingSearch) {
//         throw new NotFoundException(
//           `Sensitive search with ID ${searchId} not found`,
//         );
//       }

//       const updatedSearch = await this.prisma.sensitiveSearch.update({
//         where: { id: searchId },
//         data: {
//           status: status as SearchStatus,
//         },
//         include: {
//           user: {
//             select: {
//               id: true,
//               email: true,
//               name: true,
//             },
//           },
//         },
//       });

//       const notification: SensitiveSearchNotification = {
//         type: 'SENSITIVE_SEARCH_UPDATE',
//         searchId: updatedSearch.id,
//         status: updatedSearch.status as SearchStatus,
//       };

//       this.websocketGateway.notifyAdmins(notification);

//       return updatedSearch;
//     } catch (error) {
//       console.error('Error details:', error);
//       if (
//         error instanceof BadRequestException ||
//         error instanceof NotFoundException
//       ) {
//         throw error;
//       }
//       throw new BadRequestException(
//         `Failed to update search status: ${error.message}`,
//       );
//     }
//   }
//   async getSearchStats() {
//     const stats = await this.prisma.sensitiveSearch.groupBy({
//       by: ['category', 'status'],
//       _count: true,
//     });

//     const totalSearches = await this.prisma.sensitiveSearch.count();

//     return {
//       totalSearches,
//       categoryCounts: stats,
//     };
//   }
//   async checkSearch(searchTerm: string, userId: number) {
//     const isSensitive = await this.checkSensitiveContent(searchTerm);

//     if (isSensitive) {
//       const search = await this.searchRepository.save({
//         searchTerm,
//         userId,
//         status: 'pending',
//         createdAt: new Date(),
//       });

//       // Notify admins through WebSocket
//       this.websocketGateway.server.emit('sensitiveSearchAlert', {
//         ...search,
//         user: await this.userService.findOne(userId),
//       });

//       return {
//         isSensitive: true,
//         message: 'This search contains sensitive content',
//       };
//     }

//     return { isSensitive: false };
//   }
// }
// src/search/search.service.ts
// src/search/search.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import {
  SENSITIVE_KEYWORDS,
  SensitiveKeywordCategory,
} from '../constants/sensitiveKeyword';
import {
  SearchStatus,
  SensitiveSearchNotification,
} from '../websocket/websocket.types';
import { PaginationParams } from 'src/constants/pagination';
import { SensitiveStats } from 'src/constants/Stats';

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  // tìm kiếm video
  async searchVideos(searchTerm: string, userId: number) {
    const sensitiveCheck = await this.checkSensitiveContent(searchTerm, userId);

    if (sensitiveCheck.isSensitive) {
      return {
        isSensitive: true,
        message: 'This search contains sensitive content',
        videos: [],
      };
    }

    const resultVideos = await this.prisma.video.findMany({
      where: { userId, OR: [{ title: { contains: searchTerm } }] },
      include: {
        videosProcessed: {
          include: {
            predictions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const videos = await this.prisma.video.findMany({
      where: {
        OR: [{ title: { contains: searchTerm, mode: 'insensitive' } }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      isSensitive: false,
      // videos,
      videos: resultVideos,
    };
  }

  async checkSensitiveContent(searchTerm: string, userId: number) {
    const normalizedSearch = searchTerm.toLowerCase();

    let category: SensitiveKeywordCategory | null = null;
    for (const [key, keywords] of Object.entries(SENSITIVE_KEYWORDS)) {
      if (keywords.some((keyword) => normalizedSearch.includes(keyword))) {
        category = key as SensitiveKeywordCategory;
        break;
      }
    }

    if (category) {
      const sensitiveSearch = await this.prisma.sensitiveSearch.create({
        data: {
          userId,
          searchTerm,
          category,
          status: 'pending',
        },
      });

      // Notify admins via WebSocket
      this.websocketGateway.notifyAdmins({
        type: 'SENSITIVE_SEARCH',
        searchId: sensitiveSearch.id,
        searchTerm: sensitiveSearch.searchTerm,
        category: sensitiveSearch.category,
        userId: sensitiveSearch.userId,
      });

      return {
        isSensitive: true,
        category,
        id: sensitiveSearch.id,
      };
    }

    return { isSensitive: false };
  }

  // async getSensitiveSearches() {
  //   return this.prisma.sensitiveSearch.findMany({
  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //           email: true,
  //           name: true,
  //         },
  //       },
  //     },
  //     orderBy: {
  //       createdAt: 'desc',
  //     },
  //   });
  // }
  async getSensitiveSearches(params: PaginationParams) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 10;
    const skip = (page - 1) * limit;

    const [searches, total] = await Promise.all([
      this.prisma.sensitiveSearch.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.sensitiveSearch.count(),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      data: searches,
      meta: {
        total,
        page,
        lastPage,
      },
    };
  }

  async updateSearchStatus(id: number, status: SearchStatus) {
    try {
      const searchId = Number(id);
      if (isNaN(searchId)) {
        throw new BadRequestException('Invalid ID format - must be a number');
      }

      const existingSearch = await this.prisma.sensitiveSearch.findUnique({
        where: { id: searchId },
      });

      if (!existingSearch) {
        throw new NotFoundException(
          `Sensitive search with ID ${searchId} not found`,
        );
      }

      const updatedSearch = await this.prisma.sensitiveSearch.update({
        where: { id: searchId },
        data: {
          status: status as SearchStatus,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      const notification: SensitiveSearchNotification = {
        type: 'SENSITIVE_SEARCH_UPDATE',
        searchId: updatedSearch.id,
        status: updatedSearch.status as SearchStatus,
      };

      this.websocketGateway.notifyAdmins(notification);

      return updatedSearch;
    } catch (error) {
      console.error('Error details:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update search status: ${error.message}`,
      );
    }
  }

  async getSearchStats() {
    const stats = await this.prisma.sensitiveSearch.groupBy({
      by: ['category', 'status'],
      _count: true,
    });

    const totalSearches = await this.prisma.sensitiveSearch.count();

    return {
      totalSearches,
      categoryCounts: stats,
    };
  }
  async getSensitiveStats(): Promise<SensitiveStats> {
    const [statusCount, topSearchers, topFlagged] = await Promise.all([
      this.prisma.sensitiveSearch.groupBy({
        by: ['status'],
        _count: true,
      }),
      this.prisma.$queryRaw<any[]>`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(s.id)::integer as "totalSearches"
        FROM "User" u
        JOIN "SensitiveSearch" s ON s."userId" = u.id
        GROUP BY u.id, u.name, u.email
        ORDER BY "totalSearches" DESC
        LIMIT 5
      `,
      this.prisma.$queryRaw<any[]>`
        SELECT 
          u.id,
          u.name,
          u.email,
          COUNT(s.id)::integer as "flaggedCount"
        FROM "User" u
        JOIN "SensitiveSearch" s ON s."userId" = u.id
        WHERE s.status = 'flagged'
        GROUP BY u.id, u.name, u.email
        ORDER BY "flaggedCount" DESC
        LIMIT 5
      `,
    ]);

    const distribution = {
      pending: 0,
      reviewed: 0,
      flagged: 0,
    };

    statusCount.forEach((item) => {
      distribution[item.status] = item._count;
    });

    return {
      statusDistribution: distribution,
      topSearchers,
      topFlagged,
    };
  }
}
