---
description: 'Database migration standards using Alembic'
applyTo: '**/migrations/**/*.*'
---

## Database Migrations with Alembic

### Guidelines
- Use Alembic for managing database migrations to ensure controlled schema evolution
- Always generate migrations for schema changes
- Write idempotent migration scripts that can be applied multiple times safely
- Include both upgrade and downgrade paths in your migrations
- Test migrations in a development environment before applying to production
- Document any data migration steps that require special handling
- Keep migration files under version control
- Never delete old migration files once they've been applied to production

### Best Practices
- Give migrations descriptive names that explain the change
- Keep migrations small and focused on a single change
- Include comments for complex migrations
- Use batch operations for large data migrations
- Consider performance implications of migrations on large tables
- Always backup your database before running migrations in production
- Use transactions to ensure migrations can be rolled back if they fail
- Test migrations with production-like data volumes when possible

### Example Migration
```python
"""create_user_table

Revision ID: 1234abc56789
Revises: 
Create Date: 2023-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
```
