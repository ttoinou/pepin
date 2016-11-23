var NotesAuthorized = 'You have the right to write notes.';
var NotesNotAuthorized = 'You <b>don\'t have the right</b> to write notes.';
var NotesPermission = function(permission){ return permission == 'true' ? NotesAuthorized : NotesNotAuthorized };

export default {
  'shortcut'         : 'Shortcut : ',
  'shortcuts'        : 'Shortcuts : ',
  'mousemiddle'      : 'Middle Mouse Button',
  'mousewheel'       : 'Mouse Wheel',
  'space'            : 'SPACE',
  'ctrl'             : 'CTRL',
  'shift'            : 'SHIFT',

  /*    * Overlay    */
  'ov_next'          : 'Next media in selection (if not unique) or in the collection',
  'ov_pred'          : 'Previous media in selection (if not unique) or in the collection',
  'ov_center1'       : 'This is the visualisation space of (orange) selected medias in the collection below.<br />Media playback options are located in the top toolbar.',
  'ov_center2'       : 'You can choose 2 modes of display with the two buttons at the left of the toolbar : 2D Lock or 1D Lock. If none is selected, you are in free mode : you can always explore the media by zooming with the <kbd>mouse wheel</kbd> and dragging with the mouse. <kbd>Mouse middle/wheel button</kbd> makes the media fit the avalaible space.',

  /*
   * Toolbar
   */

  'tb_logo'          : '<b>Pép✝n</b> is a fully featured web media player with gapless video playlist, annotations and media comparison',
  'tb_info'          : 'Open the left <b>sidebar</b>',
  'tb_lock2'         : '<b>2D Lock</b> : Both media\'s width and height fit the available space, the whole media is always visible and you can\'t drag the media.',
  'tb_lock1'         : '<b>1D Lock</b> : Only the smallest media\'s dimension fit the available space, you can slide the media with the <kbd>mouse wheel</kbd>, this mode is handy for very wide or tall images',
  'tb_zoom'          : '<b>Zoom</b> : Modify zoom factor (click to change between 50%, 100% and 200% or <kbd>mouse wheel</kbd>)',

  'tb_noteViewing'   : function(permission){ return 'Hide or show <b>notes</b>.<br />' + NotesPermission(permission) },
  'tb_noteEditing'   : function(permission){ return '<b>Edit</b> notes or show them without editing options.<br />' + NotesPermission(permission) },
  'tb_noteColor'     : 'Change next note\'s <b>color</b>',
  'tb_note_none'     : '<b>Modify</b> existing notes',
  'tb_note_point'    : 'Add a <b>point</b> with text',
  'tb_note_freehand' : '<b>Freehand drawing</b>',
  'tb_note_circle'   : 'Add a <b>circle</b> with text',
  'tb_note_ellipse'  : 'Add an <b>ellipse</b> with text',
  'tb_note_square'   : 'Add a <b>square</b> with text',
  'tb_note_rect'     : 'Add a <b>rectangle</b> with text',
  'tb_note_delete'   : '<b>Delete</b> an existing note',

  'tb_volume'        : 'Global <b>volume</b> of Pép✝n',
  'tb_speed'         : 'Video playback <b>speed</b>',
  'tb_timecode'      : '<b>Seek</b> a precise moment in the video (click the icon to change mode between frame number / timecode)',
  'tb_loop'          : '<b>Loop</b> video',
  'tb_next'          : '<b>Next</b> frame',
  'tb_pred'          : '<b>Previous</b> frame',
  'tb_playpause'     : '<b>Play / Pause</b>',

  'tb_exit'          : '<b>Close</b> Pép✝n',
  'tb_help'          : 'Show or hide <b>this help</b>',
  'tb_fullscreen'    : 'Enable or disable <b>fullscreen</b>',
  'tb_download'      : '<b>Download</b> current media',

  /*
   * Collection
   */
  'co_showVideos'     : 'Show or hide videos',
  'co_showImages'     : 'Show or hide images',
  'co_ctrl'           : 'Add or remove medias from selection',
  'co_shift'          : 'Add multiple medias in selection',
  'co_ab'             : 'Make a comparison of medias',
  'co_edit'           : 'Create a gapless video playlist',
  'co_mediaLoading'   : function(url){ return 'This media did\'nt load yet... Are you using the right URL ? \n'+url;},
  //'co_mediaLoaded'    : function(url){ return 'Le média a fini de se charger... Êtes vous sûr de l\'URL ? \n'+url;},
  'co_mediaLoaded'    : function(url){ return '';},
  'co_shellBefore'    : 'Open or close this <b>shell</b>',
  'co_shellAfter'     : 'Close this <b>shell</b>',
  'co_scrollbar'      : 'Collection\'s scrollbar : <kbd>mouse click</kbd> to go somewhere, <kbd>mouse wheel</kbd> to scroll. Scroll with <kbd>Alt</kbd> key pressed to go faster'
}