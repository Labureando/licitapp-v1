import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Licitacion } from '../entities/licitacion.entity';
import { OrganoContratacion } from '../entities/organo-contratacion.entity';
import { Alerta } from '../entities/alerta.entity';
import { AlertMatch } from '../entities/alert-match.entity';
import { SavedLicitacion } from '../entities/saved-licitacion.entity';
import { CpvCode } from '../entities/cpv-code.entity';
import { ScrapingLog } from '../entities/scraping-log.entity';
import * as bcrypt from 'bcryptjs';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'licitaapp',
  entities: [User, Organization, Licitacion, OrganoContratacion, Alerta, AlertMatch, SavedLicitacion, CpvCode, ScrapingLog],
  synchronize: false,
});

async function seed() {
    await AppDataSource.initialize();
    console.log('🌱 Seeding database...');

    // ── CPVs top level ──
    const cpvRepo = AppDataSource.getRepository(CpvCode);
    const cpvs = [
        { id: '03000000', description: 'Productos agrícolas, ganadería, pesca, silvicultura', level: 0 },
        { id: '09000000', description: 'Productos derivados del petróleo, combustibles, electricidad', level: 0 },
        { id: '14000000', description: 'Productos de minería, metales básicos', level: 0 },
        { id: '15000000', description: 'Alimentos, bebidas, tabaco', level: 0 },
        { id: '22000000', description: 'Material impreso y productos relacionados', level: 0 },
        { id: '30000000', description: 'Equipos y material informático, telecomunicaciones', level: 0 },
        { id: '33000000', description: 'Equipos médicos, farmacéuticos', level: 0 },
        { id: '34000000', description: 'Equipos de transporte', level: 0 },
        { id: '35000000', description: 'Equipos de seguridad, contra incendios, defensa', level: 0 },
        { id: '39000000', description: 'Mobiliario, complementos, electrodomésticos', level: 0 },
        { id: '44000000', description: 'Estructuras y materiales de construcción', level: 0 },
        { id: '45000000', description: 'Trabajos de construcción', level: 0 },
        { id: '48000000', description: 'Paquetes de software y sistemas de información', level: 0 },
        { id: '50000000', description: 'Servicios de reparación y mantenimiento', level: 0 },
        { id: '55000000', description: 'Servicios de hostelería, restauración', level: 0 },
        { id: '60000000', description: 'Servicios de transporte', level: 0 },
        { id: '64000000', description: 'Servicios postales y telecomunicaciones', level: 0 },
        { id: '65000000', description: 'Servicios públicos', level: 0 },
        { id: '66000000', description: 'Servicios financieros y de seguros', level: 0 },
        { id: '70000000', description: 'Servicios inmobiliarios', level: 0 },
        { id: '71000000', description: 'Servicios de arquitectura, ingeniería, inspección', level: 0 },
        { id: '72000000', description: 'Servicios TI: consultoría, desarrollo, internet', level: 0 },
        { id: '73000000', description: 'Servicios de investigación y desarrollo', level: 0 },
        { id: '75000000', description: 'Servicios de administración pública, defensa', level: 0 },
        { id: '77000000', description: 'Servicios agrícolas, silvícolas, jardinería', level: 0 },
        { id: '79000000', description: 'Servicios a empresas: jurídicos, marketing, RRHH', level: 0 },
        { id: '80000000', description: 'Servicios de enseñanza y formación', level: 0 },
        { id: '85000000', description: 'Servicios de salud y asistencia social', level: 0 },
        { id: '90000000', description: 'Servicios de limpieza, residuos, medio ambiente', level: 0 },
        { id: '92000000', description: 'Servicios recreativos, culturales, deportivos', level: 0 },
        { id: '98000000', description: 'Otros servicios comunitarios, sociales, personales', level: 0 },
    ];

    for (const cpv of cpvs) {
        const exists = await cpvRepo.findOneBy({ id: cpv.id });
        if (!exists) {
            await cpvRepo.save(cpv);
        }
    }
    console.log(`  ✅ ${cpvs.length} CPVs top-level insertados`);

    // ── Organización de test ──
    const orgRepo = AppDataSource.getRepository(Organization);
    let org = await orgRepo.findOneBy({ nif: 'B12345678' });
    if (!org) {
        org = await orgRepo.save({
            name: 'Empresa Test SL',
            nif: 'B12345678',
            cnae: '6201',
            sector: 'Tecnología',
            size: 'PYME',
            ccaa: 'MAD',
            cpvPreferences: ['72000000', '48000000', '30000000'],
            plan: 'PRO',
        });
    }
    console.log('  ✅ Organización test creada');

    // ── Usuario admin de test ──
    const userRepo = AppDataSource.getRepository(User);
    const exists = await userRepo.findOneBy({ email: 'admin@test.com' });
    if (!exists) {
        const passwordHash = await bcrypt.hash('test1234', 10);
        await userRepo.save({
            email: 'admin@test.com',
            name: 'Admin Test',
            passwordHash,
            role: 'OWNER',
            organizationId: org.id,
        });
    }
    console.log('  ✅ Usuario admin@test.com / test1234 creado');

    console.log('🌱 Seed completado!');
    await AppDataSource.destroy();
}

seed().catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
});