var NotesAuthorized = 'Vous avez les droits pour écrire des notes.';
var NotesNotAuthorized = 'Vous <b>n\'avez pas les droits</b> pour écrire des notes.';
var NotesPermission = function(permission){ return permission == 'true' ? NotesAuthorized : NotesNotAuthorized };

export default {
  'shortcut'         : 'Raccourci : ',
  'shortcuts'        : 'Raccourcis : ',
  'mousemiddle'      : 'Bouton Milieu Souris',
  'mousewheel'       : 'Molette Souris',
  'space'            : 'ESPACE',
  'ctrl'             : 'CTRL',
  'shift'            : 'SHIFT',

  /*
   * Overlay
   */
  'ov_next'          : 'Média suivant dans la liste des médias ou dans la sélection si multiple',
  'ov_pred'          : 'Média précédent dans la liste des médias ou dans la sélection si multiple',
  'ov_center1'       : 'Ceci est l\'espace de visualisation des médias sélectionnés (en orange) dans la barre de sélection située juste en dessous.<br />Les options de lecture des médias sont situées dans la barre d\'outils tout en haut.',
  'ov_center2'       : 'Vous pouvez choisir 2 modes d\'affichage des médias, sélectionnables grâce aux boutons à gauche de la barre d\'outils. Si aucun n\'est sélectionné, vous êtes en mode libre : vous pouvez parcourir l\'image à votre guise en zoomant avec la <kbd>molette</kbd> et en la déplaçant avec la souris. Le bouton <kbd>milieu de la souris</kbd> vous permet de rendre le média entièrement visible.',

  /*
   * Toolbar
   */

  'tb_logo'          : '<b>Pép✝n</b> est un Espace de Prévisualisation Intra Net',
  'tb_info'          : 'Ouvrir les <b>informations</b>',
  'tb_lock2'         : '<b>Lock 2D</b> : les deux dimensions du média s\'ajustent automatiquement selon l\'espace disponible pour que l\'ensemble du média soit visible, vous ne pouvez pas déplacer le média',
  'tb_lock1'         : '<b>Lock 1D</b> : la dimension la plus petite du média s\'ajuste à l\'espace disponible et la <kbd>molette</kbd> vous permet de glisser le média dans l\'autre dimension, mode pratique pour les médias très larges ou très hauts',
  'tb_zoom'          : '<b>Zoom</b> : Changer le coefficient de zoom (cliquer pour changer entre 50%, 100% et 200% ou molette de souris)',

  'tb_noteViewing'   : function(permission){ return 'Montrer ou cacher les <b>notes</b>.<br />' + NotesPermission(permission) },
  'tb_noteEditing'   : function(permission){ return '<b>Editer</b> les notes ou les voir normalement.<br />' + NotesPermission(permission) },
  'tb_noteColor'     : 'Changer la <b>couleur</b> de la prochaine note',
  'tb_note_none'     : '<b>Modifier</b> les notes existantes',
  'tb_note_point'    : 'Ajouter un <b>point</b> avec du texte',
  'tb_note_freehand' : '<b>Dessiner</b> à main levée',
  'tb_note_circle'   : 'Ajouter un <b>cercle</b> avec du texte',
  'tb_note_ellipse'  : 'Ajouter une <b>ellipse</b> avec du texte',
  'tb_note_square'   : 'Ajouter un <b>carré</b> avec du texte',
  'tb_note_rect'     : 'Ajouter un <b>rectangle</b> avec du texte',
  'tb_note_delete'   : '<b>Supprimer</b> des notes existantes',

  'tb_volume'        : '<b>Volume</b> général de Pépin',
  'tb_speed'         : '<b>Vitesse</b> de lecture des vidéos',
  'tb_timecode'      : '<b>Seeker</b> un moment préçis de la vidéo ou changer le mode temorel (numéro de frame ou timecode)',
  'tb_loop'          : 'Faire <b>boucler</b> le ou les vidéos ou non',
  'tb_next'          : 'Image <b>suivante</b>',
  'tb_pred'          : 'Image <b>précédente</b>',
  'tb_playpause'     : '<b>Play / Pause</b>',

  'tb_exit'          : '<b>Quitter</b> Pépin',
  'tb_help'          : 'Activer ou désactiver <b>cette aide</b>',
  'tb_fullscreen'    : 'Activer ou désactiver le <b>plein écran</b>',
  'tb_download'      : '<b>Télécharger</b> le média en cours',

  /*
   * Collection
   */
  'co_showVideos'     : 'Afficher ou non les vidéos',
  'co_showImages'     : 'Afficher ou non les images',
  'co_ctrl'           : 'Ajouter ou enlever des médias à la selection',
  'co_shift'          : 'Ajouter plusieurs médias d\'un coup à la selection',
  'co_ab'             : 'Faire une comparaison de médias AB, ABC ou ABCD',
  'co_edit'           : 'Créer un bout à bout de vidéos',
  'co_mediaLoading'   : function(url){ return 'Le média n\'a pas fini de se charger... Êtes vous sûr de l\'URL ? \n'+url;},
  //'co_mediaLoaded'    : function(url){ return 'Le média a fini de se charger... Êtes vous sûr de l\'URL ? \n'+url;},
  'co_mediaLoaded'    : function(url){ return '';},
  'co_shellBefore'    : 'Ouvrir ou fermer la <b>coquille</b>',
  'co_shellAfter'     : 'Fermer la <b>coquille</b>',
  'co_scrollbar'      : 'Barre de défilement des médias : <kbd>clic de souris</kbd> pour aller quelque part, <kbd>molette de souris</kbd> pour défiler. Utiliser la touche <kbd>Alt</kbd> pour aller plus vite'

}