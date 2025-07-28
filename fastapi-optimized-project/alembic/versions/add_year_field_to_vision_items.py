"""Add year field to vision_items table

Revision ID: add_year_field_vision
Revises: dcd8e9331b03
Create Date: 2025-07-27 23:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision = 'add_year_field_vision'
down_revision = 'e06874b65f31'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add year column with default value
    current_year = datetime.now().year
    op.add_column('vision_items', sa.Column('year', sa.Integer(), nullable=True, index=True))
    
    # Update existing records to have the current year
    op.execute(f"UPDATE vision_items SET year = {current_year} WHERE year IS NULL")
    
    # Make the column non-nullable after setting default values
    op.alter_column('vision_items', 'year', nullable=False)


def downgrade() -> None:
    op.drop_column('vision_items', 'year')