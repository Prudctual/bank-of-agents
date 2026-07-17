// ============================================
// Database Seed Script
// ============================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء تهيئة قاعدة البيانات...');

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@bankofagents.com' },
    update: {},
    create: {
      email: 'demo@bankofagents.com',
      name: 'مستخدم تجريبي',
      passwordHash,
      wallet: {
        create: {
          balance: 500,
          currency: 'USD',
        },
      },
    },
  });

  console.log('✅ تم إنشاء المستخدم:', user.email);

  // Create agents
  const agents = [
    {
      name: 'وكيل التحليل المالي',
      description: 'يحلل البيانات المالية ويولد التقارير',
      type: 'analyzer',
      provider: 'openai' as const,
      trustScore: 85,
      dailyLimit: 100,
      balance: 75,
    },
    {
      name: 'وكيل دعم العملاء',
      description: 'يرد على استفسارات العملاء ويحل المشكلات',
      type: 'support',
      provider: 'anthropic' as const,
      trustScore: 90,
      dailyLimit: 50,
      balance: 45,
    },
    {
      name: 'وكيل البحث',
      description: 'يجري أبحاث السوق ويجمع المعلومات',
      type: 'researcher',
      provider: 'openai' as const,
      trustScore: 75,
      dailyLimit: 80,
      balance: 30,
    },
  ];

  for (const agentData of agents) {
    const apiKey = `agent_${uuidv4().replace(/-/g, '')}`;
    
    const agent = await prisma.agent.upsert({
      where: { 
        id: `${user.id}-${agentData.name}`.slice(0, 36) 
      },
      update: {},
      create: {
        userId: user.id,
        name: agentData.name,
        description: agentData.description,
        type: agentData.type,
        provider: agentData.provider,
        trustScore: agentData.trustScore,
        apiKey,
        wallet: {
          create: {
            balance: agentData.balance,
            dailyLimit: agentData.dailyLimit,
            spentToday: Math.random() * agentData.dailyLimit * 0.5,
          },
        },
        constraints: {
          create: {
            perTransactionLimit: agentData.dailyLimit * 0.25,
            requiresApproval: true,
            approvalThreshold: agentData.dailyLimit * 0.5,
            allowedRecipients: ['openai.com', 'anthropic.com'],
          },
        },
      },
    });

    console.log(`✅ تم إنشاء الوكيل: ${agent.name} (مفتاح: ${apiKey.slice(0, 20)}...)`);

    // Create some sample transactions
    const transactionReasons = [
      'استدعاء GPT-4 للتحليل',
      'معالجة استعلام العميل',
      'البحث عن بيانات السوق',
      'إنشاء تقرير',
      'تحليل المنافسين',
    ];

    for (let i = 0; i < 5; i++) {
      const agentWallet = await prisma.agentWallet.findUnique({
        where: { agentId: agent.id },
      });

      if (agentWallet) {
        await prisma.transaction.create({
          data: {
            fromWalletId: agentWallet.id,
            agentId: agent.id,
            amount: Math.random() * 5 + 1,
            type: 'api_payment',
            status: 'completed',
            reason: transactionReasons[Math.floor(Math.random() * transactionReasons.length)],
            createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }
  }

  // Create a pending approval request
  const firstAgent = await prisma.agent.findFirst({
    where: { userId: user.id },
  });

  if (firstAgent) {
    await prisma.approvalRequest.create({
      data: {
        agentId: firstAgent.id,
        amount: 75,
        reason: 'تحليل معمق للبيانات المالية للربع الأول - يتطلب استهلاك tokens عالي',
        urgency: 'high',
      },
    });
    console.log('✅ تم إنشاء طلب موافقة معلق');
  }

  console.log('\n🎉 تمت تهيئة قاعدة البيانات بنجاح!');
  console.log('\n📧 بيانات الدخول:');
  console.log('   البريد: demo@bankofagents.com');
  console.log('   كلمة المرور: demo123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ خطأ:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
