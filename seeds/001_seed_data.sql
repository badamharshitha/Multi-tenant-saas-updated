
-- ===============================
-- FIXED UUIDS (for consistency)
-- ===============================

-- Tenant ID
-- Demo Company
-- 11111111-1111-1111-1111-111111111111

-- Super Admin ID
-- 00000000-0000-0000-0000-000000000000

-- Tenant Admin ID
-- 22222222-2222-2222-2222-222222222222

-- Users
-- 33333333-3333-3333-3333-333333333333
-- 44444444-4444-4444-4444-444444444444

-- Projects
-- 55555555-5555-5555-5555-555555555555
-- 66666666-6666-6666-6666-666666666666

-- ===============================
-- SUPER ADMIN (tenant_id = NULL)
-- ===============================

INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    full_name,
    role
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    NULL,
    'superadmin@system.com',
    '$2b$10$UZOtr2fJRv3501rw4X1e0.jN/PSU9mbDmPzXJLhDu8cqTbMrhV7AS',
    'System Super Admin',
    'super_admin'
);

-- ===============================
-- DEMO TENANT
-- ===============================

INSERT INTO tenants (
    id,
    name,
    subdomain,
    status,
    subscription_plan,
    max_users,
    max_projects
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Demo Company',
    'demo',
    'active',
    'pro',
    25,
    15
);

-- ===============================
-- TENANT ADMIN
-- ===============================

INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    full_name,
    role
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'admin@demo.com',
    '$2b$10$UO9yl3RLDwx8FF.FBCVqdexr/KLlY1k6SfCM01/cqHARund1pKF4W',
    'Demo Admin',
    'tenant_admin'
);

-- ===============================
-- REGULAR USERS
-- ===============================

INSERT INTO users (
    id,
    tenant_id,
    email,
    password_hash,
    full_name,
    role
) VALUES
(
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'user1@demo.com',
    '$2b$10$lO52ycrMWarTPpd.v0DsOe5cu4mTCmdyLRLZ.7e9wnIQuG1//nvLC',
    'User One',
    'user'
),
(
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    'user2@demo.com',
    '$2b$10$lO52ycrMWarTPpd.v0DsOe5cu4mTCmdyLRLZ.7e9wnIQuG1//nvLC',
    'User Two',
    'user'
);

-- ===============================
-- PROJECTS
-- ===============================

INSERT INTO projects (
    id,
    tenant_id,
    name,
    description,
    created_by
) VALUES
(
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'Project Alpha',
    'First demo project',
    '22222222-2222-2222-2222-222222222222'
),
(
    '66666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'Project Beta',
    'Second demo project',
    '22222222-2222-2222-2222-222222222222'
);

-- ===============================
-- TASKS
-- ===============================

INSERT INTO tasks (
    id,
    project_id,
    tenant_id,
    title,
    description,
    priority,
    assigned_to
) VALUES
(
    gen_random_uuid(),
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'Design homepage',
    'Create homepage design',
    'high',
    '33333333-3333-3333-3333-333333333333'
),
(
    gen_random_uuid(),
    '55555555-5555-5555-5555-555555555555',
    '11111111-1111-1111-1111-111111111111',
    'Setup database',
    'Configure PostgreSQL',
    'medium',
    '44444444-4444-4444-4444-444444444444'
),
(
    gen_random_uuid(),
    '66666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'Create API endpoints',
    'Develop REST APIs',
    'high',
    '33333333-3333-3333-3333-333333333333'
),
(
    gen_random_uuid(),
    '66666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'Write documentation',
    'Prepare project docs',
    'low',
    '44444444-4444-4444-4444-444444444444'
),
(
    gen_random_uuid(),
    '66666666-6666-6666-6666-666666666666',
    '11111111-1111-1111-1111-111111111111',
    'Testing phase',
    'Perform integration testing',
    'medium',
    NULL
);
