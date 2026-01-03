/**
 * 社交平台控制器
 * 处理动态、评论、点赞相关功能
 */

import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getSocketServer } from '../services/socket.service';

/**
 * 创建动态
 */
export const createPost = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { content, images, videoUrl, topics, visibility = 'public', type } = req.body;

    if (!content && !images && !videoUrl) {
      return res.status(400).json({ error: '动态内容不能为空' });
    }

    const postType = type === 'question' ? 'question' : 'status';

    const post = await prisma.post.create({
      data: {
        userId,
        content: content || '',
        images: images ? JSON.stringify(images) : null,
        videoUrl,
        topics: topics ? JSON.stringify(topics) : null,
        type: postType,
        visibility
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true
          }
        }
      }
    });

    // 获取关注者列表
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      select: { followerId: true }
    });

    // 通过 WebSocket 通知所有关注者
    const io = getSocketServer();
    io.emit('new-post', {
      followers: followers.map(f => f.followerId),
      post
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: '发布动态失败' });
  }
};

/**
 * 获取动态列表（关注的人 + 公开动态）
 */
export const getPosts = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      page = 1,
      limit = 20,
      filter = 'following',
      type,
      includeComments = 'false',
      commentLimit = 2
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    const includeReplyPreview = String(includeComments) === 'true';
    const replyLimit = Math.min(Math.max(Number(commentLimit) || 2, 1), 5);

    let where: any = {};
    if (typeof type === 'string' && type.trim()) {
      where.type = type;
    }

    if (filter === 'following') {
      // 获取关注的人的动态
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      });

      const followingIds = following.map(f => f.followingId);
      where = {
        ...where,
        OR: [
          { userId: { in: followingIds } },
          { userId } // 包含自己的动态
        ],
        visibility: { in: ['public', 'followers'] }
      };
    } else if (filter === 'public') {
      // 公开动态（热门）
      where = {
        ...where,
        visibility: 'public'
      };
    } else if (filter === 'mine') {
      // 我的动态
      where = { ...where, userId };
    }

    const baseInclude = {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
          isVerified: true
        }
      },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      }
    } as const;

    const postsPromise = includeReplyPreview
      ? prisma.post.findMany({
          where,
          include: {
            ...baseInclude,
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    avatar: true,
                    isVerified: true
                  }
                }
              },
              orderBy: { createdAt: 'desc' },
              take: replyLimit
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum
        })
      : prisma.post.findMany({
          where,
          include: baseInclude,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum
        });

    const [posts, total] = await Promise.all([
      postsPromise,
      prisma.post.count({ where })
    ]);

    // 检查当前用户是否点赞过这些动态
    const postIds = posts.map(p => p.id);
    const userLikes = await prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds }
      },
      select: { postId: true }
    });

    const likedPostIds = new Set(userLikes.map(l => l.postId));

    const postsWithLikeStatus = posts.map(post => {
      const likeCount = post._count.likes;
      const commentCount = post._count.comments;
      return {
        ...post,
        images: post.images ? JSON.parse(post.images) : [],
        topics: post.topics ? JSON.parse(post.topics) : [],
        isLiked: likedPostIds.has(post.id),
        likeCount,
        commentCount,
        likesCount: likeCount,
        commentsCount: commentCount,
        comments: includeReplyPreview && 'comments' in post ? post.comments : undefined
      };
    });

    res.json({
      posts: postsWithLikeStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: '获取动态失败' });
  }
};

/**
 * 获取指定用户的动态列表
 */
export const getPostsByUser = async (req: Request, res: Response) => {
  try {
    const viewerId = req.userId!;
    const { userId } = req.params;
    const { page = 1, limit = 20, type } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId };
    if (typeof type === 'string' && type.trim()) {
      where.type = type;
    }

    if (viewerId !== userId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: userId
          }
        }
      });
      const visibility = follow ? ['public', 'followers'] : ['public'];
      where.visibility = { in: visibility };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              bio: true,
              isVerified: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.post.count({ where })
    ]);

    const postIds = posts.map(post => post.id);
    const userLikes = postIds.length
      ? await prisma.like.findMany({
          where: {
            userId: viewerId,
            postId: { in: postIds }
          },
          select: { postId: true }
        })
      : [];
    const likedPostIds = new Set(userLikes.map(like => like.postId));

    const postsWithStatus = posts.map(post => {
      const likeCount = post._count.likes;
      const commentCount = post._count.comments;
      return {
        ...post,
        images: post.images ? JSON.parse(post.images) : [],
        topics: post.topics ? JSON.parse(post.topics) : [],
        isLiked: likedPostIds.has(post.id),
        likeCount,
        commentCount,
        likesCount: likeCount,
        commentsCount: commentCount
      };
    });

    res.json({
      posts: postsWithStatus,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: '获取用户动态失败' });
  }
};

/**
 * 获取单个动态详情
 */
export const getPostById = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            isVerified: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }

    // 检查权限
    if (post.visibility === 'private' && post.userId !== userId) {
      return res.status(403).json({ error: '无权查看该动态' });
    }

    // 检查是否点赞
    const userLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId
        }
      }
    });

    // 增加浏览量
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.json({
      ...post,
      images: post.images ? JSON.parse(post.images) : [],
      topics: post.topics ? JSON.parse(post.topics) : [],
      isLiked: !!userLike,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      likesCount: post._count.likes,
      commentsCount: post._count.comments
    });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: '获取动态详情失败' });
  }
};

/**
 * 更新动态
 */
export const updatePost = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { content, images, videoUrl, topics, visibility } = req.body;

    const existing = await prisma.post.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: '动态不存在' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: '无权编辑该动态' });
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        content,
        images: images ? JSON.stringify(images) : undefined,
        videoUrl,
        topics: topics ? JSON.stringify(topics) : undefined,
        visibility
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: '更新动态失败' });
  }
};

/**
 * 删除动态
 */
export const deletePost = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id }
    });

    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: '无权删除该动态' });
    }

    await prisma.post.delete({
      where: { id }
    });

    res.json({ message: '动态已删除' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: '删除动态失败' });
  }
};

/**
 * 点赞动态
 */
export const likePost = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // 检查动态是否存在
    const post = await prisma.post.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }

    // 检查是否已点赞
    const existing = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: '已经点赞过了' });
    }

    // 创建点赞记录
    await prisma.like.create({
      data: {
        postId: id,
        userId
      }
    });

    // 获取点赞用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, avatar: true }
    });

    // 通知动态作者
    if (post.userId !== userId) {
      const io = getSocketServer();
      io.emit('post-liked', {
        postAuthorId: post.userId,
        liker: user,
        postId: id
      });
    }

    res.json({ message: '点赞成功' });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: '点赞失败' });
  }
};

/**
 * 取消点赞
 */
export const unlikePost = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    await prisma.like.delete({
      where: {
        postId_userId: {
          postId: id,
          userId
        }
      }
    });

    res.json({ message: '已取消点赞' });
  } catch (error) {
    console.error('Unlike post error:', error);
    res.status(500).json({ error: '取消点赞失败' });
  }
};

/**
 * 评论动态
 */
export const commentPost = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { content, replyToId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '评论内容不能为空' });
    }

    // 检查动态是否存在
    const post = await prisma.post.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }

    // 如果是回复评论，检查被回复的评论是否存在
    if (replyToId) {
      const replyTo = await prisma.comment.findUnique({
        where: { id: replyToId }
      });

      if (!replyTo) {
        return res.status(404).json({ error: '被回复的评论不存在' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        postId: id,
        userId,
        content,
        replyToId
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    // 通知动态作者
    if (post.userId !== userId) {
      const io = getSocketServer();
      io.emit('post-commented', {
        postAuthorId: post.userId,
        commenter: comment.user,
        postId: id,
        comment
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Comment post error:', error);
    res.status(500).json({ error: '评论失败' });
  }
};

/**
 * 获取动态的评论列表
 */
export const getComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId: id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVerified: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.comment.count({ where: { postId: id } })
    ]);

    res.json({
      comments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: '获取评论失败' });
  }
};

/**
 * 删除评论
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { commentId } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ error: '无权删除该评论' });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ message: '评论已删除' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: '删除评论失败' });
  }
};

/**
 * 搜索动态
 */
export const searchPosts = async (req: Request, res: Response) => {
  try {
    const { q, topics, page = 1, limit = 20, type } = req.query;

    if (!q && !topics) {
      return res.status(400).json({ error: '请提供搜索关键词或话题' });
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    let where: any = {
      visibility: 'public'
    };
    if (typeof type === 'string' && type.trim()) {
      where.type = type;
    }

    if (q) {
      where.content = {
        contains: q as string
      };
    }

    if (topics) {
      const topicArray = typeof topics === 'string' ? [topics] : (topics as string[]);
      where.topics = {
        contains: topicArray[0]
      };
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              isVerified: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.post.count({ where })
    ]);

    const postsWithCounts = posts.map(post => {
      const likeCount = post._count.likes;
      const commentCount = post._count.comments;
      return {
        ...post,
        images: post.images ? JSON.parse(post.images) : [],
        topics: post.topics ? JSON.parse(post.topics) : [],
        likeCount,
        commentCount,
        likesCount: likeCount,
        commentsCount: commentCount
      };
    });

    res.json({
      posts: postsWithCounts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({ error: '搜索失败' });
  }
};

/**
 * 收藏动态
 */
export const favoritePost = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id: postId } = req.params;

    // 检查是否已收藏
    const existing = await prisma.favorite.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: '已经收藏过该动态' });
    }

    const favorite = await prisma.favorite.create({
      data: {
        postId,
        userId
      }
    });

    res.status(201).json(favorite);
  } catch (error) {
    console.error('Favorite post error:', error);
    res.status(500).json({ error: '收藏失败' });
  }
};

/**
 * 取消收藏
 */
export const unfavoritePost = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id: postId } = req.params;

    await prisma.favorite.delete({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    res.json({ message: '取消收藏成功' });
  } catch (error) {
    console.error('Unfavorite post error:', error);
    res.status(500).json({ error: '取消收藏失败' });
  }
};

/**
 * 获取我的收藏列表
 */
export const getMyFavorites = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId },
        include: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                  isVerified: true
                }
              },
              _count: {
                select: {
                  likes: true,
                  comments: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.favorite.count({ where: { userId } })
    ]);

    const posts = favorites.map(fav => {
      const likeCount = fav.post._count.likes;
      const commentCount = fav.post._count.comments;
      return {
        ...fav.post,
        images: fav.post.images ? JSON.parse(fav.post.images) : [],
        topics: fav.post.topics ? JSON.parse(fav.post.topics) : [],
        likeCount,
        commentCount,
        likesCount: likeCount,
        commentsCount: commentCount,
        favoritedAt: fav.createdAt
      };
    });

    res.json({
      posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: '获取收藏列表失败' });
  }
};
