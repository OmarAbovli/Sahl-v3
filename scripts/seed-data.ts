import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';

async function seed() {
    console.log('🌱 Starting seed...');

    try {
        // 1. Create a Company
        console.log('Creating company...');
        const companyName = 'Sahl Tech Solutions';

        // Check if company exists
        let company: typeof schema.companies.$inferSelect;
        const existingCompany = await db.query.companies.findFirst({
            where: eq(schema.companies.name, 'sahl-tech')
        });

        if (existingCompany) {
            company = existingCompany;
            console.log('Company already exists:', company.id);
        } else {
            const [newCompany] = await db.insert(schema.companies).values({
                name: 'sahl-tech',
                displayName: companyName,
                isActive: true,
            }).returning();
            company = newCompany;
            console.log('Created company:', company.id);
        }

        // 2. Create Users (Super Admin, Admin, Employee)
        console.log('Creating users...');
        const passwordHash = await hash('123456', 10);
        const usersToCreate = [
            {
                uniqueKey: 'super_admin',
                email: 'super@sahl.com',
                role: 'super_admin',
                companyId: company.id,
            },
            {
                uniqueKey: 'admin',
                email: 'admin@sahl.com',
                role: 'company_admin',
                companyId: company.id,
            },
            {
                uniqueKey: 'employee',
                email: 'employee@sahl.com',
                role: 'employee',
                companyId: company.id,
            },
        ];

        for (const u of usersToCreate) {
            const existingUser = await db.query.users.findFirst({
                where: eq(schema.users.uniqueKey, u.uniqueKey)
            });

            if (!existingUser) {
                await db.insert(schema.users).values({
                    ...u,
                    passwordHash,
                    isActive: true,
                    expiresAt: '2030-01-01T00:00:00Z',
                    permissions: { view_dashboard: true, manage_users: u.role === 'company_admin' },
                });
                console.log(`Created user: ${u.uniqueKey}`);
            } else {
                console.log(`User exists: ${u.uniqueKey}`);
            }
        }

        // 3. Create Warehouses
        console.log('Creating warehouses...');
        let warehouseId: number;
        const existingWarehouse = await db.query.warehouses.findFirst({
            where: eq(schema.warehouses.name, 'Main Warehouse')
        });

        if (existingWarehouse) {
            warehouseId = existingWarehouse.id;
        } else {
            const [wh] = await db.insert(schema.warehouses).values({
                companyId: company.id,
                name: 'Main Warehouse',
                location: 'Cairo, Egypt',
                isActive: true,
            }).returning();
            warehouseId = wh.id;
        }

        // 4. Create Inventory Items
        console.log('Creating inventory...');
        const items = [
            { itemName: 'Laptop Dell XPS', quantity: 50, unitPrice: '1500.00', category: 'Electronics' },
            { itemName: 'Office Chair', quantity: 100, unitPrice: '150.00', category: 'Furniture' },
            { itemName: 'Wireless Mouse', quantity: 200, unitPrice: '25.00', category: 'Electronics' },
        ];

        for (const item of items) {
            await db.insert(schema.inventory).values({
                companyId: company.id,
                warehouseId,
                ...item,
            });
        }

        // 5. Create Invoices
        console.log('Creating invoices...');
        const invoices = [
            { invoiceNumber: 'INV-001', clientName: 'Client A', amount: '5000.00', status: 'paid', issueDate: '2025-01-01', dueDate: '2025-02-01' },
            { invoiceNumber: 'INV-002', clientName: 'Client B', amount: '3500.00', status: 'pending', issueDate: '2025-01-05', dueDate: '2025-02-05' },
        ];

        for (const invoice of invoices) {
            await db.insert(schema.invoices).values({
                companyId: company.id,
                ...invoice,
            });
        }

        console.log('✅ Seed complete!');
    } catch (e) {
        console.error('❌ Seed failed:', e);
    }
}

seed();
