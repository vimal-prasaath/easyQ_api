// Simple test script for Super Admin APIs
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testSuperAdminAPIs() {
    console.log('🚀 Testing Super Admin APIs...\n');

    try {
        // Test 1: Super Admin Signup
        console.log('1. Testing Super Admin Signup...');
        const signupResponse = await fetch(`${BASE_URL}/api/super-admin/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'superadmin',
                email: 'admin@easyq.com',
                password: 'password123'
            })
        });

        if (signupResponse.ok) {
            const signupData = await signupResponse.json();
            console.log('✅ Signup successful:', signupData.data.superAdminId);
        } else {
            const errorData = await signupResponse.json();
            console.log('❌ Signup failed:', errorData.message);
        }

        // Test 2: Super Admin Login
        console.log('\n2. Testing Super Admin Login...');
        const loginResponse = await fetch(`${BASE_URL}/api/super-admin/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: 'superadmin',
                password: 'password123'
            })
        });

        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('✅ Login successful:', loginData.data.superAdmin.superAdminId);
        } else {
            const errorData = await loginResponse.json();
            console.log('❌ Login failed:', errorData.message);
        }

        // Test 3: Get All Admins
        console.log('\n3. Testing Get All Admins...');
        const adminsResponse = await fetch(`${BASE_URL}/api/super-admin/admins`);
        
        if (adminsResponse.ok) {
            const adminsData = await adminsResponse.json();
            console.log('✅ Get admins successful:', adminsData.data.totalCount, 'admins found');
        } else {
            const errorData = await adminsResponse.json();
            console.log('❌ Get admins failed:', errorData.message);
        }

        // Test 4: Get All Users
        console.log('\n4. Testing Get All Users...');
        const usersResponse = await fetch(`${BASE_URL}/api/super-admin/users?page=1&limit=5`);
        
        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            console.log('✅ Get users successful:', usersData.data.pagination.totalCount, 'users found');
        } else {
            const errorData = await usersResponse.json();
            console.log('❌ Get users failed:', errorData.message);
        }

        console.log('\n🎉 Super Admin API testing completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testSuperAdminAPIs();
