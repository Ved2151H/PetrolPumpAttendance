import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '-' + file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    
    // Save to public/uploads/notes
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'notes');
    const filepath = join(uploadDir, filename);
    
    // Ensure directory exists
    try {
      await import('fs/promises').then(fs => fs.mkdir(uploadDir, { recursive: true }));
    } catch (err) {
      // ignore
    }
    
    await writeFile(filepath, buffer);
    
    // Return the URL
    const fileUrl = `/uploads/notes/${filename}`;
    
    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
