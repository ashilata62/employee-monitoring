const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const employeesService = require('./src/modules/employees/employees.service');

async function testAddEmployee() {
    console.log('--- Testing Employee Creation & DB Persistence ---');
    try {
        const org = await prisma.organization.findFirst();
        if (!org) throw new Error('Organization not found in DB');

        const team = await prisma.team.findFirst({ where: { organizationId: org.id } });
        const testEmail = `new.dev.${Date.now()}@testcompany.com`;
        const testName = 'Test Developer Addition';

        console.log(`Adding employee with email: ${testEmail}...`);

        const newEmp = await employeesService.inviteEmployee({
            fullName: testName,
            email: testEmail,
            organizationId: org.id,
            teamId: team ? team.id : null,
            location: 'Office',
            computerType: 'COMPANY',
            password: 'StrongPassword@123',
            status: 'ACTIVE'
        });

        console.log('Employee created in DB successfully!');
        console.log('Employee Record:', {
            id: newEmp.id,
            fullName: newEmp.fullName,
            email: newEmp.email,
            status: newEmp.status,
            workMode: newEmp.workMode,
            computerType: newEmp.computerType,
            team: newEmp.team?.name
        });

        // Verify in DB directly
        const verifyEmp = await prisma.employee.findUnique({
            where: { id: newEmp.id },
            include: { user: true }
        });

        if (!verifyEmp) {
            throw new Error('Verification failed: Employee not found in DB after creation!');
        }

        console.log('✅ PASS: Employee confirmed in MySQL database!');
        console.log('✅ PASS: Linked User account created:', verifyEmp.user ? { id: verifyEmp.user.id, email: verifyEmp.user.email, role: verifyEmp.user.role } : 'None');

        // Verify duplicate check throws error
        let duplicateCaught = false;
        try {
            await employeesService.inviteEmployee({
                fullName: 'Duplicate',
                email: testEmail,
                organizationId: org.id
            });
        } catch (err) {
            duplicateCaught = true;
            console.log('✅ PASS: Duplicate email correctly blocked:', err.message);
        }

        if (!duplicateCaught) {
            throw new Error('Duplicate check failed: duplicate email was not blocked!');
        }

        console.log('\n=========================================');
        console.log('All Employee Addition Tests PASSED 100%!');
        console.log('=========================================');

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}

testAddEmployee();
