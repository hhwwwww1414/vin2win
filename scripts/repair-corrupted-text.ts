import './load-env';

import { AdminActionType, AdminEntityType, UserNotificationType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const QUESTION_MARK_PATTERN = '?????';

const CORRUPTED_NOTIFICATION_MESSAGES = {
  saleArchived: '?????????? ?????????? ? ????? ? ????? ? ????????? ??????.',
  salePublished: '?????????? ?????? ???????? ? ???????????? ? ??????? ?????.',
  wantedArchived: '?????? ?????????? ? ????? ? ????? ? ????????? ??????.',
  sellerVerified: '??? ??????? ???????? ??????? ???????????.',
} as const;

const CORRUPTED_ACTION_DESCRIPTIONS = {
  pendingToPublished: '?? ????????? -> ????????????',
  publishedToArchived: '???????????? -> ? ??????',
  archivedToPublished: '? ?????? -> ????????????',
  sellerVerified: '??????? ???????? ??????? ??? ??????????????.',
} as const;

function buildSaleTitle(make: string, model: string, year: number) {
  return `${make} ${model}, ${year}`;
}

function buildWantedTitle(models: string[], budgetMax: number) {
  return `${models.join(', ')} до ${budgetMax.toLocaleString('ru-RU')} ₽`;
}

function buildNotificationTitle(entityType: AdminEntityType | null, entityTitle: string) {
  if (entityType === AdminEntityType.WANTED_LISTING) {
    return `Статус запроса обновлён: ${entityTitle}`;
  }

  return `Статус объявления обновлён: ${entityTitle}`;
}

function buildNotificationMessage(entityType: AdminEntityType | null, corruptedMessage: string) {
  if (corruptedMessage === CORRUPTED_NOTIFICATION_MESSAGES.sellerVerified) {
    return 'Ваш профиль продавца успешно подтверждён.';
  }

  if (entityType === AdminEntityType.WANTED_LISTING) {
    if (corruptedMessage === CORRUPTED_NOTIFICATION_MESSAGES.wantedArchived) {
      return 'Запрос переведён в архив и снят с активного показа.';
    }

    return 'Статус запроса обновлён модератором.';
  }

  if (corruptedMessage === CORRUPTED_NOTIFICATION_MESSAGES.saleArchived) {
    return 'Объявление переведено в архив и снято с активного показа.';
  }

  if (corruptedMessage === CORRUPTED_NOTIFICATION_MESSAGES.salePublished) {
    return 'Объявление прошло проверку и опубликовано в рабочей ленте.';
  }

  return 'Статус объявления обновлён модератором.';
}

function buildActionTitle(entityType: AdminEntityType, entityTitle: string) {
  if (entityType === AdminEntityType.WANTED_LISTING) {
    return `Статус запроса обновлён: ${entityTitle}`;
  }

  return `Статус объявления обновлён: ${entityTitle}`;
}

function buildActionDescription(corruptedDescription: string) {
  switch (corruptedDescription) {
    case CORRUPTED_ACTION_DESCRIPTIONS.pendingToPublished:
      return 'На модерации -> Опубликовано';
    case CORRUPTED_ACTION_DESCRIPTIONS.publishedToArchived:
      return 'Опубликовано -> В архиве';
    case CORRUPTED_ACTION_DESCRIPTIONS.archivedToPublished:
      return 'В архиве -> Опубликовано';
    case CORRUPTED_ACTION_DESCRIPTIONS.sellerVerified:
      return 'Профиль продавца отмечен как подтверждённый.';
    default:
      return 'Статус обновлён модератором.';
  }
}

async function findQuestionMarkCorruption() {
  const textColumns = await prisma.$queryRawUnsafe<Array<{ table_name: string; column_name: string }>>(
    `
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND data_type IN ('text', 'character varying')
      ORDER BY table_name, column_name
    `
  );

  const findings: Array<{ tableName: string; columnName: string; count: number }> = [];

  for (const column of textColumns) {
    const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT COUNT(*)::int AS count FROM "${column.table_name}" WHERE "${column.column_name}" LIKE '%${QUESTION_MARK_PATTERN}%'`
    );

    const count = rows[0]?.count ?? 0;
    if (count > 0) {
      findings.push({
        tableName: column.table_name,
        columnName: column.column_name,
        count,
      });
    }
  }

  return findings;
}

async function repairNotifications() {
  const saleTitles = new Map(
    (
      await prisma.saleListing.findMany({
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
        },
      })
    ).map((listing) => [listing.id, buildSaleTitle(listing.make, listing.model, listing.year)])
  );

  const wantedTitles = new Map(
    (
      await prisma.wantedListing.findMany({
        select: {
          id: true,
          models: true,
          budgetMax: true,
        },
      })
    ).map((listing) => [listing.id, buildWantedTitle(listing.models, listing.budgetMax)])
  );

  const notifications = await prisma.userNotification.findMany({
    where: {
      OR: [
        {
          title: {
            contains: QUESTION_MARK_PATTERN,
          },
        },
        {
          message: {
            contains: QUESTION_MARK_PATTERN,
          },
        },
      ],
    },
    select: {
      id: true,
      type: true,
      entityType: true,
      entityId: true,
      title: true,
      message: true,
    },
  });

  let repairedNotifications = 0;

  for (const notification of notifications) {
    if (notification.type === UserNotificationType.SELLER_PROFILE_CHANGED) {
      await prisma.userNotification.update({
        where: {
          id: notification.id,
        },
        data: {
          title: 'Профиль продавца подтверждён',
          message: 'Ваш профиль продавца успешно подтверждён.',
        },
      });
      repairedNotifications += 1;
      continue;
    }

    const entityTitle =
      notification.entityType === AdminEntityType.WANTED_LISTING
        ? wantedTitles.get(notification.entityId ?? '') ?? 'Запрос на подбор'
        : saleTitles.get(notification.entityId ?? '') ?? 'Объявление';

    await prisma.userNotification.update({
      where: {
        id: notification.id,
      },
      data: {
        title: buildNotificationTitle(notification.entityType, entityTitle),
        message: buildNotificationMessage(notification.entityType, notification.message),
      },
    });

    repairedNotifications += 1;
  }

  return repairedNotifications;
}

async function repairAdminActionLog() {
  const saleTitles = new Map(
    (
      await prisma.saleListing.findMany({
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
        },
      })
    ).map((listing) => [listing.id, buildSaleTitle(listing.make, listing.model, listing.year)])
  );

  const wantedTitles = new Map(
    (
      await prisma.wantedListing.findMany({
        select: {
          id: true,
          models: true,
          budgetMax: true,
        },
      })
    ).map((listing) => [listing.id, buildWantedTitle(listing.models, listing.budgetMax)])
  );

  const actions = await prisma.adminActionLog.findMany({
    where: {
      OR: [
        {
          title: {
            contains: QUESTION_MARK_PATTERN,
          },
        },
        {
          description: {
            contains: QUESTION_MARK_PATTERN,
          },
        },
      ],
    },
    select: {
      id: true,
      entityType: true,
      entityId: true,
      actionType: true,
      title: true,
      description: true,
    },
  });

  let repairedActions = 0;

  for (const action of actions) {
    if (action.actionType === AdminActionType.SELLER_PROFILE_VERIFIED) {
      await prisma.adminActionLog.update({
        where: {
          id: action.id,
        },
        data: {
          title: 'Профиль продавца подтверждён',
          description: 'Профиль продавца отмечен как подтверждённый.',
        },
      });
      repairedActions += 1;
      continue;
    }

    if (action.actionType === AdminActionType.SELLER_PROFILE_UNVERIFIED) {
      await prisma.adminActionLog.update({
        where: {
          id: action.id,
        },
        data: {
          title: 'Подтверждение продавца снято',
          description: 'Метка подтверждённого продавца снята.',
        },
      });
      repairedActions += 1;
      continue;
    }

    const entityTitle =
      action.entityType === AdminEntityType.WANTED_LISTING
        ? wantedTitles.get(action.entityId) ?? 'Запрос на подбор'
        : saleTitles.get(action.entityId) ?? 'Объявление';

    await prisma.adminActionLog.update({
      where: {
        id: action.id,
      },
      data: {
        title: buildActionTitle(action.entityType, entityTitle),
        description: buildActionDescription(action.description),
      },
    });

    repairedActions += 1;
  }

  return repairedActions;
}

async function main() {
  const before = await findQuestionMarkCorruption();
  const repairedNotifications = await repairNotifications();
  const repairedActions = await repairAdminActionLog();
  const after = await findQuestionMarkCorruption();

  console.log(
    JSON.stringify(
      {
        before,
        repairedNotifications,
        repairedActions,
        after,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
