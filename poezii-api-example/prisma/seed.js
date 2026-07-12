// prisma/seed.ts
import { PrismaClient, Plan } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();
async function main() {
    console.log('Seeding database...');
    // Șterge datele existente
    await prisma.usageLog.deleteMany();
    await prisma.apiKey.deleteMany();
    await prisma.poem.deleteMany();
    await prisma.author.deleteMany();
    // Creează autori
    const eminescu = await prisma.author.create({
        data: {
            name: 'Mihai Eminescu',
            slug: 'mihai-eminescu',
            bio: 'Cel mai important poet romantic român.',
            birthYear: 1850,
            deathYear: 1889,
        },
    });
    const arghezi = await prisma.author.create({
        data: {
            name: 'Tudor Arghezi',
            slug: 'tudor-arghezi',
            bio: 'Poet și scriitor român, cunoscut pentru originalitatea limbajului.',
            birthYear: 1880,
            deathYear: 1967,
        },
    });
    // Creează poezii
    await prisma.poem.create({
        data: {
            title: 'Luceafărul',
            slug: 'luceafarul',
            content: 'A fost odată ca-n povești,\nA fost ca niciodată...',
            summary: 'Povestea cosmică a Luceafărului.',
            year: 1883,
            type: 'EPIC',
            keywords: 'luceafăr,iubire,cosmic',
            authorId: eminescu.id,
        },
    });
    await prisma.poem.create({
        data: {
            title: 'Flori de mucigai',
            slug: 'flori-de-mucigai',
            content: 'Din negru' + "'" + 'mi-ai crescut, floare...',
            summary: 'Versuri puternice despre suferință și speranță.',
            year: 1931,
            type: 'LYRIC',
            keywords: 'mucigai,suferință,speranță',
            authorId: arghezi.id,
        },
    });
    // Creează o cheie API pentru testare (plan PRO)
    const plainKey = `poezii_test_${Math.random().toString(36).substring(2, 15)}`;
    const keyHash = await bcrypt.hash(plainKey, 10);
    await prisma.apiKey.create({
        data: {
            prefix: 'poezii_test',
            keyHash: keyHash,
            plan: Plan.PRO,
        },
    });
    console.log(`Seeding completed.`);
    console.log(`Test API key (PRO): ${plainKey}`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
