
using System;
using System.IO;
using System.IO.Compression;

class OffsetStream : Stream
{
    private readonly Stream _base;
    private readonly long _offset;
    public OffsetStream(Stream baseStream, long offset)
    {
        _base = baseStream;
        _offset = offset;
        _base.Seek(_offset, SeekOrigin.Begin);
    }
    public override bool CanRead { get { return _base.CanRead; } }
    public override bool CanSeek { get { return _base.CanSeek; } }
    public override bool CanWrite { get { return false; } }
    public override long Length { get { return _base.Length - _offset; } }
    public override long Position
    {
        get { return _base.Position - _offset; }
        set { _base.Position = value + _offset; }
    }
    public override long Seek(long offset, SeekOrigin origin)
    {
        if (origin == SeekOrigin.Begin) return _base.Seek(offset + _offset, SeekOrigin.Begin) - _offset;
        if (origin == SeekOrigin.End) return _base.Seek(offset, SeekOrigin.End) - _offset;
        return _base.Seek(offset, SeekOrigin.Current) - _offset;
    }
    public override int Read(byte[] buffer, int offset, int count) => _base.Read(buffer, offset, count);
    public override void Flush() => _base.Flush();
    public override void SetLength(long value) => throw new NotSupportedException();
    public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
}

class Program
{
    static void Main()
    {
        string exe = @"d:\Kiaan\employee-monitoring\employee-monitoirng-backend\public\agent\EMS-Tracker-latest.exe";
        long zipOffset = -1;
        using (FileStream fs = new FileStream(exe, FileMode.Open, FileAccess.Read))
        {
            byte[] buf = new byte[65536];
            int read;
            long currentPos = 0;
            while ((read = fs.Read(buf, 0, buf.Length)) > 0)
            {
                for (int i = 0; i < read - 4; i++)
                {
                    if (buf[i] == 0x50 && buf[i+1] == 0x4B && buf[i+2] == 0x03 && buf[i+3] == 0x04)
                    {
                        zipOffset = currentPos + i;
                        break;
                    }
                }
                if (zipOffset != -1) break;
                currentPos += read;
            }
        }

        Console.WriteLine("Zip offset: " + zipOffset);
        using (FileStream fs = new FileStream(exe, FileMode.Open, FileAccess.Read))
        using (OffsetStream os = new OffsetStream(fs, zipOffset))
        using (ZipArchive archive = new ZipArchive(os, ZipArchiveMode.Read))
        {
            Console.WriteLine("Archive validated! Total entries: " + archive.Entries.Count);
        }
    }
}
