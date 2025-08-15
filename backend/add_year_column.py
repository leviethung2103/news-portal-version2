#!/usr/bin/env python3
"""
Script to add year column to vision_items table
"""
import os
import asyncio
import asyncpg
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def add_year_column():
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("DATABASE_URL environment variable not set")
        return False
    
    try:
        # Convert asyncpg URL to connection parameters
        if database_url.startswith('postgresql+asyncpg://'):
            database_url = database_url.replace('postgresql+asyncpg://', 'postgresql://')
        
        # Parse the URL
        import urllib.parse
        parsed = urllib.parse.urlparse(database_url)
        
        conn = await asyncpg.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path[1:]  # Remove leading slash
        )
        
        # Check if year column already exists
        result = await conn.fetchrow("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'vision_items' AND column_name = 'year'
        """)
        
        if result:
            print("Year column already exists in vision_items table")
            await conn.close()
            return True
        
        print("Adding year column to vision_items table...")
        
        # Add year column with default value
        current_year = datetime.now().year
        await conn.execute(f"""
            ALTER TABLE vision_items 
            ADD COLUMN year INTEGER DEFAULT {current_year} NOT NULL
        """)
        
        # Create index on year column
        await conn.execute("""
            CREATE INDEX idx_vision_items_year ON vision_items(year)
        """)
        
        # Update existing records to have the current year
        await conn.execute(f"""
            UPDATE vision_items SET year = {current_year} WHERE year IS NULL
        """)
        
        print(f"Successfully added year column with default value {current_year}")
        
        # Verify the column was added
        result = await conn.fetchrow("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'vision_items' AND column_name = 'year'
        """)
        
        if result:
            print(f"Verified: year column added - {result}")
        
        await conn.close()
        return True
        
    except Exception as e:
        print(f"Error adding year column: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(add_year_column())
    if success:
        print("Migration completed successfully!")
    else:
        print("Migration failed!")