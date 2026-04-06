import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Hair Salon', nameHr: 'Frizerski salon', slug: 'hair-salon', icon: 'scissors', sortOrder: 1 },
  { name: 'Barber', nameHr: 'Brijačnica', slug: 'barber', icon: 'scissors', sortOrder: 2 },
  { name: 'Beauty & Spa', nameHr: 'Ljepota i Spa', slug: 'beauty-spa', icon: 'sparkles', sortOrder: 3 },
  { name: 'Nail Salon', nameHr: 'Salon za nokte', slug: 'nail-salon', icon: 'hand', sortOrder: 4 },
  { name: 'Auto Mechanic', nameHr: 'Automehaničar', slug: 'auto-mechanic', icon: 'wrench', sortOrder: 5 },
  { name: 'Auto Electrician', nameHr: 'Autoelektričar', slug: 'auto-electrician', icon: 'zap', sortOrder: 6 },
  { name: 'Doctor (General)', nameHr: 'Liječnik opće prakse', slug: 'doctor-general', icon: 'stethoscope', sortOrder: 7 },
  { name: 'Dentist', nameHr: 'Stomatolog', slug: 'dentist', icon: 'smile', sortOrder: 8 },
  { name: 'Physiotherapist', nameHr: 'Fizioterapeut', slug: 'physiotherapist', icon: 'activity', sortOrder: 9 },
  { name: 'Veterinarian', nameHr: 'Veterinar', slug: 'veterinarian', icon: 'heart', sortOrder: 10 },
  { name: 'Tutor', nameHr: 'Instruktor', slug: 'tutor', icon: 'book-open', sortOrder: 11 },
  { name: 'Music Teacher', nameHr: 'Učitelj glazbe', slug: 'music-teacher', icon: 'music', sortOrder: 12 },
  { name: 'Personal Trainer', nameHr: 'Osobni trener', slug: 'personal-trainer', icon: 'dumbbell', sortOrder: 13 },
  { name: 'Yoga / Pilates', nameHr: 'Yoga / Pilates', slug: 'yoga-pilates', icon: 'sun', sortOrder: 14 },
  { name: 'Plumber', nameHr: 'Vodoinstalater', slug: 'plumber', icon: 'droplet', sortOrder: 15 },
  { name: 'Electrician', nameHr: 'Električar', slug: 'electrician', icon: 'zap', sortOrder: 16 },
  { name: 'Painter', nameHr: 'Soboslikar', slug: 'painter', icon: 'paint-bucket', sortOrder: 17 },
  { name: 'Cleaning Service', nameHr: 'Čišćenje', slug: 'cleaning', icon: 'spray-can', sortOrder: 18 },
  { name: 'Photographer', nameHr: 'Fotograf', slug: 'photographer', icon: 'camera', sortOrder: 19 },
  { name: 'Lawyer', nameHr: 'Odvjetnik', slug: 'lawyer', icon: 'briefcase', sortOrder: 20 },
  { name: 'Accountant', nameHr: 'Računovođa', slug: 'accountant', icon: 'calculator', sortOrder: 21 },
  { name: 'Massage Therapist', nameHr: 'Masažer', slug: 'massage', icon: 'hand', sortOrder: 22 },
  { name: 'Tattoo Artist', nameHr: 'Tattoo umjetnik', slug: 'tattoo', icon: 'pen-tool', sortOrder: 23 },
  { name: 'Pet Grooming', nameHr: 'Grooming za kućne ljubimce', slug: 'pet-grooming', icon: 'heart', sortOrder: 24 },
];

async function main() {
  console.log('Seeding categories...');

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  console.log(`Seeded ${categories.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
