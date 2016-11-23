import os,sys, re, math
import subprocess as sp
from PIL import Image as Im
from datetime import datetime
import argparse

# based on http://zulko.github.io/blog/2013/09/27/read-and-write-video-frames-in-python-using-ffmpeg/
# about JPG options : http://effbot.org/imagingbook/format-jpeg.htm

parser = argparse.ArgumentParser(description='Render, thanks to ffmpeg & ffprobe, a film strip-like image that can be used as an animated video thumbnail in Pepin')
# 110 is the default height of thumbnails in pepin (Collection.vue)
parser.add_argument('--height', '-he', default=110, type=int,
                    help='Height of one thumbnail')
# 139 is the default number of frames for video thumbnails in pepin (Collection.vue)
parser.add_argument('--frames', '-f', default=139, type=int,
                    help='Number of frames used to create the strip')
parser.add_argument('--safety', '-s', default=5, type=int,
                    help='Used to prevent bugs with ffmpeg')

parser.add_argument('--video', '-v', type=str,
                    help='URL to the video file')

parser.add_argument('--output', '-o', default="filmStrip_out.jpg", type=str,
                    help='URL to the output film strip image')

parser.add_argument('--jpeg', '-j', default=True, type=bool,
                    help='JPEG quality')

parser.add_argument('--jpeg_quality', '-q', default=70, type=int,
                    help='JPEG quality')

parser.add_argument('--jpeg_optimize', '-opt', default=True, type=bool,
                    help='JPEG optimize boolean')

parser.add_argument('--jpeg_progressive', '-prog', default=True, type=bool,
                    help='JPEG progressive boolean')

parser.add_argument('--ffmpeg', default='ffmpeg', type=str,
                    help='Location of ffmpeg exec')

parser.add_argument('--ffprobe', default='ffprobe', type=str,
                    help='Location of ffprobe exec')

args = parser.parse_args()

def generateVideoThumbnail(args):
    video_file = args.video
    thumb_file = args.output

    print "Source : " , video_file
    frame_count = getVideoFrameCount(args,video_file) - args.safety
    if frame_count <= args.safety:
        frame_count = args.safety

    ImgFramesCount = args.frames

    width = getVideoWidth(args,video_file)
    height = getVideoHeight(args,video_file)
    ratio = float(width)/float(height)

    print "Original WxH : ",width,"x",height,":",float(width)/float(height)

    ThumbWidth = int( ratio * args.height )
    ThumbHeight = args.height 
    ThumbSurface = ThumbWidth*ThumbHeight
    ImgHeight = ImgFramesCount * ThumbHeight
    
    print "New WxH : ",ThumbWidth,"x",ThumbHeight,":",float(ThumbWidth)/float(ThumbHeight)
    
    # Creating the "canvas" (white bg)
    imagePrincipale = Im.new('RGB',(ThumbWidth,ImgHeight),'white')
    framerate = getVideoFrameRate(args,video_file)

    print ("Output JPG : %dx%d\nFrames : %d @ %dfps" % (ThumbWidth, ImgHeight, frame_count, framerate))

    t1 = datetime.now()
    for i in range(0,ImgFramesCount):
        #self.stdout.write("\rProcess : %d/%d" % (i+1, args.frames), ending='')
        #self.stdout.flush()
        image = getFrameFromVideo(args,video_file, frameToTC( args , i / float(ImgFramesCount) * frame_count, framerate ),ThumbWidth,ThumbHeight)
        imagePrincipale.paste(image,(0, i*ThumbHeight ))
    
    t2 = datetime.now()
    deltaSeconds = (t2-t1).seconds
    print ("Process time : %ds" % deltaSeconds)

    if args.jpeg:
      imagePrincipale.save(thumb_file,"JPEG",quality=args.jpeg_quality,optimize=args.jpeg_optimize,progressive=args.jpeg_progressive)
    else:
      imagePrincipale.save(thumb_file)


def getFrameFromVideo(args,video_file,timecode,width,height): 
    command = [ args.ffmpeg,
            '-ss', timecode,
            '-i', video_file,
            '-f', 'image2pipe',
            '-s', str(width)+'x'+str(height),
            '-pix_fmt', '+rgb24',
            '-vframes', '1',
            '-vcodec', 'rawvideo','-']     
            
    try:
        pipe = sp.Popen(command, stdout=sp.PIPE, stderr=sp.PIPE, bufsize=10**8)
        stdout, stderr = pipe.communicate()
        
        if( len(stdout) < width * height * 3):
            return Im.new('RGB',(width,height),'white')
        else:
            return Im.frombytes('RGB',(width,height),stdout)
        
    except Exception as e :
        sys.stderr.write("\ngetFrameFromVideo : " + str(e))

        
def getVideoWidth(args,video_file):
    return int(ffprobeReadStream(args,video_file,'width')[0])

def getVideoHeight(args,video_file):
    return int(ffprobeReadStream(args,video_file,'height')[0])
        
def getVideoFrameCount(args,video_file):
    return int(ffprobeReadStream(args,video_file,'nb_read_frames')[0])


def getVideoFrameRate(args,video_file):
    # result pattern :
    # streams.stream.0.r_frame_rate="30/1"
    (stdout, stderr) = ffprobeReadStream(args,video_file,'r_frame_rate')
    #print "stdout : " , stdout
    rxp = re.compile("(\d+)\/(\d)+")
    m = rxp.match(stdout)
    #print m.group(0)
    return float(int(m.group(1))/int(m.group(2)))

def ffprobeReadStream(args,video_file,stream):
    command = [ args.ffprobe,
      '-v', 'error',
      '-count_frames',
      '-select_streams', 'v:0',
      '-show_entries', 'stream='+stream,
      '-of', 'default=nokey=1:noprint_wrappers=1',
      video_file
    ]
    pipe = sp.Popen(command, stdout = sp.PIPE, stderr=sp.PIPE, bufsize=10**8)
    stdout, stderr = pipe.communicate()
    return stdout,stderr

def frameToTC(args,frame, framerate):
    return str(frame / framerate + 1.0 / (2.0 * framerate) )


generateVideoThumbnail( args )