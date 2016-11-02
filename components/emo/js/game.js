function new_scene(div_name){
    renderer = new THREE.WebGLRenderer({blending: THREE.AdditiveBlending,
//					shadowMapEnabled:  true,
					maxLights: 10,
					alpha: true});
//    renderer.setClearColor(0x000000, 0);    
    var width = window.innerWidth;
    var height = window.innerHeight;
    document.camera = new THREE.PerspectiveCamera(90, width/height, .1, 10000);
    scene = new THREE.Scene();
    scene.add(document.camera);
    document.scene=scene;
    document.camera.position.z = 500;
    document.camera.position.y = height/2;//375;
    document.camera.position.x = 0;
    
    var ambient_light = new THREE.AmbientLight(0x313131, 1.);
//    scene.add(ambient_light);
    
    var scene_light = new THREE.PointLight( 0x5992c2, .5, 0. );
    document.scene_light2 = new THREE.PointLight( 0xff3333, 1.5, 0. );
    var scene_light3 = new THREE.PointLight( 0x5992c2, .5, 0. );

//    scene.fog = new THREE.Fog("#253e63", 1., 1500);
//    scene.fog = new THREE.FogExp2("#000000"/*"#253e63"*/, 0.001);
    //scene.add(fog);

    scene_light.position.x=0;
    scene_light.position.y=10;
    scene_light.position.z=100;

    document.scene_light2_dir=1;
    document.scene_light2.position.x=-300;
    document.scene_light2.position.y=500;
    document.scene_light2.position.z=-1000;

    scene_light.position.x=300;
    scene_light.position.y=-500;
    scene_light.position.z=0;
    

//    scene.add(scene_light);    
//    scene.add(document.scene_light2);
//    scene.add(scene_light3);

    document.clock = new THREE.Clock();
    document.clock.start();
    renderer.setSize(width, height);

    document.lights=[];
    document.player=null;
    document.playerLight=null;
    document.background_stars=[];
    document.WIMPs = [];
    document.en_bullets=[];
    document.bullets=[];
    document.photons=[];
    document.left_bound = -(window.innerWidth/2)-100;
    document.right_bound = (window.innerWidth/2)+100;
    
    //outline of playable field                                                                                                                                           
    //var helper = new THREE.GridHelper( 2*Math.abs(document.left_bound), 10 );
    //helper.setColors( 0x0000ff, 0x808080 );
    //helper.position.y = window.innerHeight/2;
    //scene.add( helper );
    //var geometry = new THREE.PlaneGeometry( 2*Math.abs(document.left_bound), window.innerHeight, 10, 10 );
    //var material = new THREE.MeshPhongMaterial( {color: 0xffffff,opacity: 0.1, wireframe: true} );
    //var plane = new THREE.Mesh( geometry, material );
    //    plane.position.y=window.innerHeight/2;//-(window.innerWidth/2)-100;                                                                                                   
/*    var geometry = new THREE.BoxGeometry(2*Math.abs(document.left_bound), window.innerHeight, 10, 10, 10);
    var material = new THREE.MeshLambertMaterial( {color: 0xffffff,opacity: 0.5, transparent:true, wireframe: true} );       
    var plane = new THREE.Mesh( geometry, material );                                                                                                                    
    plane.position.y=window.innerHeight/2;//-(window.innerWidth/2)-100;         
    plane.position.z=-50;    
    scene.add( plane );

*/
    // Load the background texture
    var texture = new THREE.ImageUtils.loadTexture( document.background_image );
    console.log(texture);
    var backgroundMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({
            map: texture, 
        }));
    backgroundMesh.material.depthTest = false;
    backgroundMesh.material.depthWrite = false;
    backgroundMesh.position.x=0;
    backgroundMesh.position.y=0;
    backgroundMesh.position.z =0;
    //backgroundMesh.position.y=-2 + 0 + window.innerHeight/2;//-(window.innerWidth/2)-100;                                                                      
    //backgroundMesh.position.z=-1000;
    //backgroundMesh.rotation.z = Math.PI/2;
    //document.planes.push(plane);
    document.backgroundscene = new THREE.Scene();

    //document.backgroundscene.add(ambient_light);                                  
    document.bgCam = new THREE.Camera();
    document.backgroundscene.add(document.bgCam);
    document.backgroundscene.add( backgroundMesh );

    
    //var geometry = new THREE.PlaneGeometry( 5000, 5000, 100, 100 );
    //for (var i = 0, l = geometry.vertices.length; i < l; i++) {
    //geometry.vertices[i].z = Math.random()*300-800;
//}
    
    //var material = new THREE.MeshLambertMaterial( {color: 0x003333} );
    //document.plane = new THREE.Mesh( geometry, material );
    //document.plane.position.z=-500;
    //scene.add( document.plane );

    
    $("#" + div_name).append(renderer.domElement);
    
}
function InitializeGrids(){
    if(!document.useGrid)
	return;
    for(var i=0; i<4; i+=1){
	var geometry = new THREE.PlaneGeometry( window.innerHeight, 2*Math.abs(document.left_bound), 10, 10 ); 
	//var geometry = new THREE.BoxGeometry(2*Math.abs(document.left_bound), window.innerHeight, 10, 10, 10);
	var material = new THREE.MeshLambertMaterial( {color: 0xffffff,opacity: 0.25, transparent:true, wireframe: true} );
	var plane = new THREE.Mesh( geometry, material );   
	plane.position.y=-2 + i*window.innerHeight + window.innerHeight/2;//-(window.innerWidth/2)-100;              
	plane.position.z=-50;
	plane.rotation.z = Math.PI/2;
	document.planes.push(plane);
	scene.add( plane );
    }
}
function AnimateGrids(clock_corr){
    if(!document.useGrid)
	return;
    var top_plane_position = -1000;
    var oob_index=-1;
    for(var i=0; i<document.planes.length; i+=1){
	document.planes[i].position.y -= clock_corr*document.plane_speed;
	if(document.planes[i].position.y > top_plane_position)
	    top_plane_position = document.planes[i].position.y;	
	if(document.planes[i].position.y < -window.innerHeight-500)
	    oob_index=i;
    }
    if(oob_index!=-1){
	document.planes[oob_index].position.y = top_plane_position + (window.innerHeight) -2;
    }
}
function GetV(seed){
    // seed is between 0 and 1. This returns a random      
    // number with magnitude at least 5     
      absval = (12.*seed - 6.)*12.;
      if(absval<0)
          absval-=5.;
      if(absval>=0)
          absval+=5.;
      return absval;
}

function CreateNebAst(){
    
    // Make nebula
    neb = Math.floor(Math.random()*document.background_nebs.length);
    var map = new THREE.TextureLoader().load( document.background_nebs[neb] );
    var material = new THREE.SpriteMaterial( { map: map, fog: true, } );
    var sprite = new THREE.Sprite( material );
    document.background_sprites.push(sprite);
    sprite.scale.set(25, 25, 25);

    InitializeNebAst(document.background_sprites.length-1, true);
    scene.add( sprite );

    // Make asteroid
    ast= Math.floor(Math.random()*document.background_ast.length);
        var map = new THREE.TextureLoader().load( document.background_ast[ast] );
        var material = new THREE.SpriteMaterial( { map: map, fog: true, transparent: true } );
        var sprite = new THREE.Sprite( material );
    sprite.scale.set(25, 25, 25);

    document.background_sprites.push(sprite);
    InitializeNebAst(document.background_sprites.length-1, true);
    
    scene.add( sprite );
}

function InitializeNebAst(index, newast){
    if(index < 0 || index > document.background_sprites.length)
        return;
    y = 2000;
    if(newast)
        y = 2000*Math.random() + 1200;
    bubble_range=1000;

    position = [Math.random() *(2*window.innerWidth)-((2*window.innerWidth)/2),
                y,
                (Math.random() * bubble_range) -1000];
    document.background_sprites[index].position.x = position[0];
    document.background_sprites[index].position.y = position[1];
    document.background_sprites[index].position.z = position[2];

}
function AnimateNebAst(anim){
    if(document.background_sprites.length < document.max_background_sprites)
	CreateNebAst();
    for(x=0; x< document.background_sprites.length; x+=1){
        document.background_sprites[x].position.y -= document.background_sprite_speed*anim;
//      document.bubbles[x]['outer'].position.y -= document.bubble_speed*anim;         
	if(document.background_sprites[x].position.y < window.innerHeight - 1000)
            InitializeNebAst(x, false);
    }
}


function CreateBubble(){

    // Get semi-random color and size
    var rsize = Math.random()*document.WIMP_size/50 + 1;
    var crand = Math.floor(Math.random()*document.bubble_colors.length);

    // Make materials and mesh
    var innerMaterial = new THREE.MeshLambertMaterial( 
	{//opacity: 0.5, 
	 color: document.bubble_colors[crand]} );        
    var outerMaterial = new THREE.MeshBasicMaterial( 
	{color: document.bubble_colors_outer[crand],
	side: THREE.BackSide} );
    var geometry = new THREE.SphereGeometry(rsize, 12, 12);
    
    // Make the object
    var bubble_inner = new THREE.Mesh(geometry, innerMaterial);
    //var bubble_outer = new THREE.Mesh(geometry, outerMaterial);

    // Put it somewhere
    document.bubbles.push({
	//"outer": bubble_outer, 
	"inner": bubble_inner});
    InitializeBubble(document.bubbles.length-1, true);

    // Add to scene
    scene.add(bubble_inner)
//    scene.add(bubble_outer);
}
function InitializeBubble(index, newbub){
    if(index < 0 || index > document.bubbles.length)
	return;
    y = 2000;
    if(newbub)
	y = 2000*Math.random() + 1200;
    var sign=-1;
    bubble_range=100;
    if(Math.random() > .5)
        sign=1;
    if(sign==-1)
        bubble_range = 100;
    position = [Math.random() *(2*window.innerWidth)-((2*window.innerWidth)/2),
		y, 
		(Math.random() * bubble_range) * sign];
    document.bubbles[index]['inner'].position.x = position[0];
    document.bubbles[index]['inner'].position.y = position[1];
    document.bubbles[index]['inner'].position.z = position[2];
 //   document.bubbles[index]['outer'].position.x = position[0];
 //   document.bubbles[index]['outer'].position.y = position[1];
 //   document.bubbles[index]['outer'].position.z = position[2];          
}
function AnimateBubbles(anim){
    if(document.bubbles.length < document.max_bubbles)
	CreateBubble();
    for(x=0; x< document.bubbles.length; x+=1){
	document.bubbles[x]['inner'].position.y -= document.bubble_speed*anim;
//	document.bubbles[x]['outer'].position.y -= document.bubble_speed*anim;
	if(document.bubbles[x]['inner'].position.y < window.innerHeight - 1000)
	    InitializeBubble(x);
    }
}


function rotateAroundObjectAxis(object, axis, radians) {

    var rotObjectMatrix = new THREE.Matrix4();
    rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    // object.matrix.multiplySelf(rotObjectMatrix);      // post-multiply
    // new code for Three.JS r55+:
    object.matrix.multiply(rotObjectMatrix);

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // old code for Three.js r50-r58:
    // object.rotation.setEulerFromRotationMatrix(object.matrix);
    // new code for Three.js r59+:
    object.rotation.setFromRotationMatrix(object.matrix);
}
$(document).mousedown(function(e){

    document.wantposx = ((e.clientX - window.innerWidth/2) );
    document.wantposy = (-(e.clientY -window.innerHeight));
    if(!document.autofire){
	document.autofire=true;
	fire();
    }
});

$(document).on("keydown", function (e) {

    if(e.which == 87)
	document.udown=true;
    else if(e.which == 83)
	document.ddown=true;
    else if(e.which == 65)
	document.ldown=true;
    else if(e.which == 68)
	document.rdown=true;
    else if(e.which==13){
	document.fire=true;
    }
    else if(e.which==74 && document.cameraFollow==true){
	document.cameraFollow=false;
	document.camera.position.z = 500;
	document.camera.position.y = window.innerHeight/2;//375;   
	document.camera.position.x = 0;
	document.camera.lookAt( new THREE.Vector3(0, window.innerHeight/2, 0));

    }
    else if(e.which==74 && document.cameraFollow==false)
	document.cameraFollow=true;


    /*else if(e.which == 13){
	bullet = new THREE.Mesh(new THREE.SphereGeometry(5,1,1),
				     new THREE.MeshBasicMaterial(
					 {color: 0xff0000}))
	bul = {"x": document.player.position.x, 'bul': bullet};
	document.bullets.push(bul);
	scene.add(bullet);
	bullet.position.x = document.player.position.x;
	bullet.position.y = document.player.position.y+10;
	bullet.position.z = document.player.position.z;
	document.getElementById(document.fire_0).pause();
	document.getElementById(document.fire_0).currentTime=0;
	document.getElementById(document.fire_0).play();
    }*/
});
function FireMissle(){
    color=0xffffff;
    missle = new THREE.Mesh(new THREE.SphereGeometry(20, 1, 1),
			    new THREE.MeshBasicMaterial(
                                {color: color}));
    document.missle=missle;
    scene.add(missle);
    missle.position.x = document.player.position.x;
    missle.position.y = document.player.position.y+10;
    missle.position.z = document.player.position.z;

    if(document.sound){
        document.getElementById(document.fire_0).pause();
        document.getElementById(document.fire_0).currentTime=0;
        document.getElementById(document.fire_0).play();
    }
}
function DetonateMissle(){
    posx = document.missle.position.x;
    posy = document.missle.position.y;
    posz = document.missle.position.z;
    MakePhotonAnimation(posx, posy, posz, 2);
    StartExplosion(posx, posy, posz, 2);
    scene.remove(document.missle);
    document.missle=null;
    if(document.sound){
        document.getElementById(document.expl).pause();
        document.getElementById(document.expl).currentTime=0;
        document.getElementById(document.expl).play();
    }


}
function FireBullet(n){
    console.log("FIREBULLET");
    colors = [0x4444aa, 0x44aa44, 0xaa4444, 0xffffff];
    color = colors[0];
    if(n<colors.length)
	color=colors[n];
    //bullet = new THREE.Mesh(new THREE.SphereGeometry(8,1,1),                     
      //                      new THREE.MeshBasicMaterial(                  
        //                        {color: color}));    
    var laserBeam= new THREEx.LaserBeam(color);
//    scene.add(laserBeam.object3d);
    var object3d= laserBeam.object3d
  //  object3d.position.x= document.player.position.x;
  //  object3d.position.y= document.player.position.y;
    object3d.rotation.z= -Math.PI/2;
    object3d.scale.set(25, 100, 25);
    bullet = object3d;

    bul = {"x": document.player.position.x, 'bul': bullet};
    document.bullets.push(bul);                                                  
    scene.add(bullet);                                                          
    bullet.position.x = document.player.position.x;                             
    bullet.position.y = document.player.position.y+10;                          
    bullet.position.z = document.player.position.z;                             

    if(document.sound){
         document.getElementById(document.fire_0).pause();    
         document.getElementById(document.fire_0).currentTime=0; 
         document.getElementById(document.fire_0).play();
    }
    if( //(document.score > 2500 && n<1) ||
	(document.score > 5000 && n<1 ) ||
//	(document.score > 7500 && n<3) ||
	(document.score > 15000 && n<2)||
	(document.score > 30000 && n<3) ){
	setTimeout( function() {
            FireBullet( n+1 );

    }, 100 );

    }

}

$(document).on("keyup", function(e){

    document.wantposx = null;
    document.wantposy = null;
    document.autofire = false;
    if(e.which == 87)
	document.udown=false;
    else if(e.which == 83)
	document.ddown=false;
    else if(e.which == 65)
	document.ldown=false;
    else if(e.which == 68)
	document.rdown=false;
    else if(e.which == 13){
	document.fire=false;
	document.play_power_up=false;
        document.getElementById(document.power_up_2).pause();
	if(document.missle!=null)
	    DetonateMissle();
	else if(document.powerWeaponCharge<1000)
	    FireBullet(0);
	else if(document.missles>0){
	    FireMissle();
	    document.missles-=1;
	}
	document.powerWeaponCharge=0;
    }
});

// From http://stackoverflow.com/questions/1344500/efficient-way-to-insert-a-number-into-a-sorted-array-of-numbers
function insert(element, array, key) {
//  if(array.length==0){
    //array.push(element);
    //return array;
//  }
    //array = 
    array.splice(locationOf(element, array, key) + 1, 0, element);
  return array;
}

function locationOf(element, array, key, start, end) {
  start = start || 0;
  end = end || array.length;
  var pivot = parseInt(start + (end - start) / 2, 10);
  if (end-start <= 1 || array[pivot] === element) return pivot;
  if (array[pivot][key] < element[key]) {
    return locationOf(element, array, key, pivot, end);
  } else {
    return locationOf(element, array, key, start, pivot);
  }
}

function fire(){
    console.log("FIRING");
    if(document.autofire == false) return;
    if(document.run_animation==false) return;
    console.log("YES");
    autofire_rate = 250; // base rate
    if(document.score > 2500) autofire_rate-=50;
    if(document.score > 5000) autofire_rate-=50;
    if(document.score > 7500) autofire_rate-=50;
    if(document.score > 10000) autofire_rate-=50;
    if(document.score > 20000) autofire_rate-=25;

    //if(!document.fire){	
//	setTimeout(fire, autofire_rate);
//	return;
  //  }
    FireBullet(0);
    /*bullet = new THREE.Mesh(new THREE.SphereGeometry(5,1,1),
                                     new THREE.MeshBasicMaterial(
                                         {color: 0xff0000}))
    insbull = {"x": document.player.position.x, "bul": bullet};
    document.bullets=insert(insbull, document.bullets, 'x');
        scene.add(bullet);
        bullet.position.x = document.player.position.x;
        bullet.position.y = document.player.position.y+10;
    bullet.position.z = document.player.position.z;
    if(document.sound){
        document.getElementById(document.fire_0).pause();
        document.getElementById(document.fire_0).currentTime=0;
        document.getElementById(document.fire_0).play();
    }*/
    setTimeout(fire, autofire_rate);
}


function NewBullet(x, y, z){

//    bullet = new THREE.Mesh(new THREE.SphereGeometry(8,1,1),
  //                                   new THREE.MeshBasicMaterial(
    //                                     {color: 0xff0000}));
    var laserBeam= new THREEx.LaserBeam(0xaa4444);
    var bullet= laserBeam.object3d
    bullet.rotation.z= -Math.PI/2;
    bullet.scale.set(35, 70, 35);
    //bullet = object3d;

/*    var map = document.SPRITE_MAP;
    var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff, fog: true } );
    var bullet = new THREE.Sprite( material );*/
    document.en_bullets.push(bullet);
    scene.add(bullet);
    bullet.position.x = x;
    bullet.position.y = y;
    bullet.position.z = z;
    
if(document.sound){
        document.getElementById(document.laser).pause();
        document.getElementById(document.laser).currentTime=0;
        document.getElementById(document.laser).play();
    }

}  

function SetWIMPActive(){
    // Sets a WIMP active
    for(x=0;x<document.WIMPs.length;x+=1){
	if(document.WIMPs[x]['active']==false){
	    document.WIMPs[x]['active']=true;
	    return;
	}
    }
}
function SpawnWIMP(){

    var size = Math.random()*document.WIMP_size + 20;
size = 50;
    var sign=-1;
    WIMP_range=200;
    if(Math.random() > .8)
	sign=1;
    if(sign==-1)
	WIMP_range = 600;

    var trand = Math.floor(Math.random()*document.planets.length);
    var texture= THREE.ImageUtils.loadTexture(document.planets[trand]);

    new_WIMP =
        { 'x': Math.random() *(2*window.innerWidth)-((2*window.innerWidth)/2),
	  'z': (Math.random() * WIMP_range + 150) * sign,     
          'y': 1800,
          'obj': new THREE.Mesh(new THREE.SphereGeometry(size, 12, 12),
                                 new THREE.MeshLambertMaterial({
				     map: texture,
				     //bumpMap: texture,
				     //bumpScale: 5,
//                                     color: 0x5992c2,
				 })),
	  'wobble':-1,
	  'speed': Math.random() *document.WIMP_speed + document.WIMP_min_speed,
	  'active': false,
	};

//    var WIMP_light = new THREE.PointLight( 0xffffff, 10., 50. );
//    scene.add(WIMP_light);
    scene.add(new_WIMP['obj']);
    if(!document.WIMPwobble)
	new_WIMP['wobble']=0;
//    WIMP_light.position.x = new_WIMP['x'];
//    WIMP_light.position.y = new_WIMP['y'];
//    WIMP_light.position.z = new_WIMP['z'];
    new_WIMP['obj'].position.x = new_WIMP['x'];
    new_WIMP['obj'].position.y = new_WIMP['y'];
    new_WIMP['obj'].position.z = new_WIMP['z'];
//    new_WIMP['light'] = WIMP_light;
    document.WIMPs.push(new_WIMP);
    
}
function AnimateBackgroundBoxes()
{
/*    document.plane.position.y-=1;
    if(document.plane.position.y==-800){
	document.plane.position.y=0;
	document.plane.geometry.vertices.length=8080;
	for(var j=19; j>=0; j--){
	    for(var i=0; i<=100; i+=1){
		document.plane.geometry.vertices.unshift(new THREE.Vector3(i*25-2500, 2000-j*20, Math.random()*300-800));
	    }
	}
    }
*/
    for(i=0;i<document.plane.geometry.vertices.length;i+=1){
	document.plane.geometry.vertices[i].z += Math.random()*6-3;
	
    }
    document.plane.geometry.verticesNeedUpdate=true;
    document.scene_light2.position.z+=document.scene_light2_dir*1;

    if(document.scene_light2.position.z>-500 || document.scene_light2.position.z<-1000)
	document.scene_light2_dir*=-1;
}

function animate(){
    if(document.run_animation==false) return;
//    if(document.player_y==-1000 || document.player_y==1000) return;
    var  clock_delta = document.clock.getDelta();
    var clock_corr = document.clock_corr * clock_delta;
    
    document.getElementById("score").innerHTML = document.score.toString();
    document.getElementById("impurities").innerHTML = document.impurities.toString();
    document.getElementById("missles").innerHTML = document.missles.toString();
    AnimateGrids(clock_corr)

    // movement
    //Charge power weapon
    if(document.fire){
	document.powerWeaponCharge+=10*clock_corr;
	if(document.powerWeaponCharge > 100 &&         
	   document.play_power_up==false && document.missles>0){
	    document.play_power_up=true;
	    //document.getElementById(document.power_up_2).pause();
            document.getElementById(document.power_up_2).currentTime=0;
            document.getElementById(document.power_up_2).play();
	}
    }
    //console.log(document.powerWeaponCharge);
   

    var osize=15;
    // PLAYER MOVEMENT MOUSE
    if(document.wantposx != null && document.player.position.x != 
       document.wantposx){
	myx = document.player.position.x;
	console.log("POS");
	console.log(myx);
	console.log(document.wantposx);
	if(myx < document.wantposx){
	    if(Math.abs(document.wantposx - myx) < osize*clock_corr)
		document.player.position.x = document.wantposx;
	    else
		document.player.position.x += osize*clock_corr;
	}
	else if(myx > document.wantposx){
	    if(Math.abs(document.wantposx - myx) < osize*clock_corr)
		document.player.position.x = document.wantposx;
            else
		document.player.position.x -= osize*clock_corr;
	}
    }
    if(document.wantposy != null && document.player.position.y !=
       document.wantposy){
	myy = document.player.position.y;
	if(myy < document.wantposy){
            if(Math.abs(document.wantposy - myy) < osize*clock_corr)
		        document.player.position.y = document.wantposy;
            else
		document.player.position.y += osize*clock_corr;
        }
	else if(myy > document.wantposy){
            if(Math.abs(document.wantposy - myy) < osize*clock_corr)
                document.player.position.y = document.wantposy;
            else
                document.player.position.y -= osize*clock_corr;
        }

    }
	

    // PLAYER MOVEMENT KEYBOARD
    var msize=15;
    if(document.udown && document.player.position.y < window.innerHeight){
	document.player.position.y += msize*clock_corr;
    }
    if(document.ddown && document.player.position.y>0){
	document.player.position.y -=msize*clock_corr;
    }
    if(document.ldown && document.player.position.x > document.left_bound){
	document.player.position.x -=msize*clock_corr;

    }
    if(document.rdown && document.player.position.x < document.right_bound){
	document.player.position.x += msize*clock_corr;
    }
    document.playerLight.position.x =document.player.position.x;
    document.playerLight.position.y =document.player.position.y;
    document.playerLight.target.position.set( document.player.position.x,
					      document.player.position.y+100, 0);
    if(document.useSpotlight){
	document.spotLight.position.x = document.player.position.x;
    document.spotLight.position.y =document.player.position.y;

    document.spotLight.lookAt(new THREE.Vector3(document.player.position.x,
					       document.player.position.y+1000,
					       0))
    }
    if(document.cameraFollow){
	document.camera.position.x = document.player.position.x;
	document.camera.position.y = document.player.position.y -50;
	document.camera.position.z = document.player.position.z + 50;
	document.camera.lookAt( new THREE.Vector3(document.player.position.x,
                                document.player.position.y+1000, 0));
	}

    if(document.frame_count%1==0){
//	AnimateBackgroundBoxes();
	document.frame_count=0;
    }
    document.frame_count+=1;
    // Make WIMPs
    //if(document.WIMPs.length < document.max_WIMPs){
//	    SpawnWIMP();
//	    }
    if(Math.random()*10000 < document.WIMP_chance){
	//SpawnWIMP();
	SetWIMPActive();
    }
    for(x=0;x<document.WIMPs.length; x+=1){
	if(document.WIMPs[x]['active']==false)
	    continue;
	document.WIMPs[x]['obj'].position.y -= 	clock_corr*document.WIMPs[x]['speed'];
	var speed_factor=.5;
	if(document.WIMPs[x]['obj'].position.z <0)
	    speed_factor =1;	
	document.WIMPs[x]['obj'].position.z += clock_corr*speed_factor*document.WIMPs[x]['speed'] *
	    document.WIMPs[x]['wobble'];
	if(Math.abs(document.WIMPs[x]['obj'].position.z) < 150 || 
	  Math.abs(document.WIMPs[x]['obj'].position.z) > 400)
	    document.WIMPs[x]['wobble']*=-1;
//	document.WIMPs[x]['light'].position.y -= document.WIMPs[x]['speed'];
	if(document.WIMPs[x]['obj'].position.y < -800){

//	    scene.remove(document.WIMPs[x]['obj']);
	    var sign=-1;
	    if(Math.random() > .8)
		sign=1;

	    document.WIMPs[x]['obj'].position.x = Math.random() *(2*window.innerWidth)-((2*window.innerWidth)/2);
	    document.WIMPs[x]['obj'].position.z = (Math.random() * 200 + 150) * sign;
            document.WIMPs[x]['obj'].position.y = Math.random()*300 + 1500;
//	    scene.remove(document.WIMPs[x]['light']);
	    //document.WIMPs.splice(x,1);
//	    x-=1;
	}
    }

    // Propagate enemy bullets
    for(x=0; x<document.en_bullets.length; x+=1){
	document.en_bullets[x].position.y -= clock_corr*document.en_bullet_speed;
	if(document.en_bullets[x].position.y < -100){
	    scene.remove(document.en_bullets[x]);
	    document.en_bullets.splice(x,1);
	    x-=1;
	    continue;
	}
	if(Math.abs(document.en_bullets[x].position.y-document.player.position.y) < 10 &&
	   Math.abs(document.en_bullets[x].position.x-document.player.position.x) < 10)
	    YouLose();
    }


    // Process Enemy movement
    ProcessEnemies(clock_corr);
    AnimateBubbles(clock_corr);
    AnimateNebAst(clock_corr);

    document.background_stars.sort(function(a, b) {
        return parseFloat(a['x']) - parseFloat(b['x']);
    });

    if(document.missle!=null){
	document.missle.position.y+=clock_corr*15;
	if(document.missle.position.y > 1000){
	    scene.remove(document.missle);
	    document.missle=null;
	}
    }
    
// Now check bullets
    var star_start=0;
    for(x=0;x<document.bullets.length; x+=1){
	
	// Propagate bullet
	document.bullets[x]['bul'].position.y+=clock_corr*30;
	
	// Delete bullet if left screen
	if(document.bullets[x]['bul'].position.y>1000)	{
	    scene.remove(document.bullets[x]['bul']);
//	    document.bullets = 
	    document.bullets.splice(x,1);
	    x-=1;
	    continue;
	}

	// Check for hit with star
	for(y=star_start;y<document.background_stars.length;y+=1){
	    // Check if xstar already > x bul
	    xdiff = (document.bullets[x]['bul'].position.x -
		     document.background_stars[y]['star'].position.x);
	    //if(xdiff < 0 && Math.abs(xdiff) > document.background_stars[y]['size']*1.15)
	//	continue;

	    // Now check collision
	    if(Math.abs(xdiff) <= document.background_stars[y]['size']*1.25
	       &&
	       Math.abs(document.bullets[x]['bul'].position.y -
			document.background_stars[y]['star'].position.y) < 40)
	    {
		// Get position of bullet
		bx = document.bullets[x]['bul'].position.x;
		by = document.bullets[x]['bul'].position.y;
                bz = document.bullets[x]['bul'].position.z;

		// Remove the bullet
		scene.remove(document.bullets[x]['bul']);
                document.bullets.splice(x,1);
		x-=1;

		// If the star has more HP, increment
		document.background_stars[y]['hit']+=1;
		if(document.background_stars[y]['hit'] < document.objcolors.length){
		    // Change color
		    if(document.sound){
			document.getElementById(document.enemy_hit).pause();
			document.getElementById(document.enemy_hit).currentTime=0;
			document.getElementById(document.enemy_hit).play();
		    }
		    MakePhotonAnimation(document.background_stars[y]['star'].position.x, 
					document.background_stars[y]['star'].position.y, 
					document.background_stars[y]['star'].position.z, 0);
		    StartExplosion(document.background_stars[y]['star'].position.x,
                                   document.background_stars[y]['star'].position.y,
                                   document.background_stars[y]['star'].position.z,  0);
		    
		    document.background_stars[y]['star'].material.materials[1].color.setHex(document.objcolors[document.background_stars[y]['hit']]);
		    break;
		}


		// EXPLODE
		//var orbTex = new THREE.Texture(orb);
		//orbTex.wrapS = THREE.RepeatWrapping;
		//orbTex.wrapT = THREE.RepeatWrapping;
		//orbTex.repeat.x = orbTex.repeat.y = 32;
		//orbTex.needsUpdate = true;
		//document.getElementById(document.dest_0).pause();
		BlowStar(y);
		break;
	    }
	}
    }
    photon_animation(clock_corr);
    light_animation();
    //document.player_y+=1;
    //document.player.position.y = document.player_y;
    setTimeout( function() {

        requestAnimationFrame( animate );

    }, 1000 / 100 );
    //requestAnimationFrame(animate);
    renderer.autoClear = false;
    renderer.clear();
    renderer.render(document.backgroundscene, document.bgCam);
    renderer.render(document.scene, document.camera);
}

function BlowStar(y){
    posx = document.background_stars[y]['star'].position.x;
    posy = document.background_stars[y]['star'].position.y;
    posz = document.background_stars[y]['star'].position.z;
    
    if(document.sound){
        document.getElementById(document.dest_0).volume=1;
        document.getElementById(document.dest_0).currentTime=0;
        document.getElementById(document.dest_0).play();
    }

    score_before = Math.floor(document.score/2500);
    mscore_before = Math.floor(document.score/1000);
    document.score += Math.round(50*(1/(document.background_stars[y]['size']/(document.min_enemy_size +
                                                                              ((document.max_enemy_size -
                                                                                document.min_enemy_size)/2)))));
    if(document.sound && ( (document.score > 5000 && !document.sound5k) ||
			   (document.score > 15000 && !document.sound15k) ||
			   (document.score > 30000 && !document.sound30k) ) ){
	if(!document.sound5k)
	    document.sound5k=true;
	else if(!document.sound15k)
	    document.sound15k=true;
	else
	    document.sound30k=true;
	document.getElementById(document.power_up).volume=1;
        document.getElementById(document.power_up).currentTime=0;
        document.getElementById(document.power_up).play();
    }
    score_after = Math.floor(document.score/2500);
    mscore_after = Math.floor(document.score/1000);
    if(mscore_after > mscore_before){
	document.missles+=1;
    }
    if(score_after>score_before && document.impurities>0)
        document.impurities-=1;
    rand = Math.floor(Math.random()*document.objcolors.length);
    document.background_stars[y]['hit'] = rand;
    document.background_stars[y]['star'].material.materials[1].color.setHex
    (document.objcolors[document.background_stars[y]['hit']]);
    
    document.background_stars[y]['y'] = Math.random()*500+1500;
    document.background_stars[y]['star'].position.y = document.background_stars[y]['y'];
    document.background_stars[y]['x']= .8*(Math.random() *window.innerWidth-(window.innerWidth/2));
    document.background_stars[y]['star'].position.x = document.background_stars[y]['x'];
    document.background_stars[y]['z'] = 10000;
    document.background_stars[y]['star'].position.z = 10000;
    MakePhotonAnimation(posx, posy, posz, 1);

    StartExplosion(posx, posy, posz, 1);

}

function InitializeAtom(index, x, y, z, hit, size){
    new_atom = {
	"x": x,
	"y": y,
	"z": z,
	"hit": hit, 
	"size": size,
	"balls": [],
    };
}
function ProcessEnemies(clock_corr)
{    
    if(document.background_stars.length < document.n_stars +
       Math.round(document.score/2000)){
	
	// Make a new enemy
	loader = new THREE.JSONLoader();
	loader.load( document.enemy_geo_0,
                     function (geometry, materials){			
			 size = Math.random()*
			     (document.max_enemy_size-document.min_enemy_size)
			     + document.min_enemy_size; 
			 rand = Math.floor(Math.random()
					   *document.objcolors.length);
			 console.log(materials);
			 materials[1].color.setHex(document.objcolors[rand]);
			 var enemy_material = 
			         new THREE.MeshFaceMaterial(materials);

		//	     THREE.MeshLambertMaterial( { color: document.objcolors[rand], ambient: 0xaaaaaa, shading: THREE.FlatShading } );

/*			 new THREE.MeshLambertMaterial( {
                            // wireframe: true,
                             color: document.objcolors[rand],
                             //vertexColors: THREE.NoColors,
			     ambient: 0xaaaaaa,
                             shading: THREE.flatShading,                   
			 });*/
			 new_star = {
			     'x': .8*(Math.random() *
				      window.innerWidth-(window.innerWidth/2)),
			     'z': 10000,//Math.random() * 50, 
			     'y': Math.random() * 1000 + 1200, 
			     'hit': rand,                                      
			     'star': new THREE.Mesh(geometry, enemy_material),
			 };
			 console.log(new_star['star']);
			     /*
        size = Math.random()*(document.max_enemy_size-document.min_enemy_size)
            + document.min_enemy_size;
        rand = Math.floor(Math.random()*document.objcolors.length);

        new_star =
            { 'x': .8*(Math.random() *window.innerWidth-(window.innerWidth/2)),
              'z': 10000,//Math.random() * 50,                                                                                                       
              'y': Math.random() * 1000 + 1200,
              'hit': rand,
              'star': new THREE.Mesh(//document.enemyGeometry,
		  new THREE.BoxGeometry(size,
					size,
					size),
                                     new THREE.MeshLambertMaterial(
                                         {wireframe: true,
                                          color: document.objcolors[rand],
					  emissive: "#282828",
					 wireframeLinewidth: 2})),
//                                        [Math.round(Math.random() *                                                                            
//                                                    document.objcolors.length)]}))                                                             
            };*/
	    new_star['star'].scale.set(size/5,size/5,size/5);
			 new_star['star'].rotation.x = Math.PI/2;                                      

	scene.add(new_star['star']);
			 
			 new_star['star'].position.x = new_star['x'];
			 new_star['star'].position.y = new_star['y'];
			 new_star['star'].position.z = new_star['z'];
			 new_star['size']=size;
			 new_star['xoff']=0;
			 //new_star['rotax'] = new THREE.Vector3(Math.random(),Math.random(),
			 //Math.random());
			 new_star['xofflim']=Math.random()*300+200;
			 new_star['xoffdir']=-1;
			 new_star['xoffstep']=Math.random()*5;
			 //document.background_stars.push(new_star);                                                                                              
			 document.background_stars = insert(new_star,
				document.background_stars, 'x');
		     });
		   }

      // Star movement                                                                                                                             
    for(x=0; x<document.background_stars.length; x+=1){

        //do x jitter                                                                                                                            
	star = document.background_stars[x];
        star['xoff']+=clock_corr*(star['xoffstep']*star['xoffdir']);
        //rotateAroundObjectAxis(star['star'], star['rotax'], .305);//50.);//Math.PI / 180);                                                        

        if(Math.abs(star['xoff'])>star['xofflim']) star['xoffdir']*=-1;
        if(star['star'].position.x < .95*document.left_bound)
            star['xoffdir'] = 1;
        else if(star['star'].position.x > .95*document.right_bound)
            star['xoffdir']=-1;
        star['star'].position.x = star['x']+star['xoff'];

        // Move downwards                                                                                                                        
        document.background_stars[x]['y'] -= clock_corr*((.1*Math.round
                                              (document.score/2000))+.5);
	if(document.background_stars[x]['y'] <= 1000)
	    document.background_stars[x]['z'] = 0;
	else if(document.background_stars[x]['y'] <= 1200){
	    document.background_stars[x]['z'] = (document.background_stars[x]['y']-1000)*50;
	}
	document.background_stars[x]['star'].position.z = document.background_stars[x]['z'];
        document.background_stars[x]['star'].position.y =
            document.background_stars[x]['y'];
        if(document.background_stars[x]['y'] < -300){
            document.background_stars[x]['y'] = Math.random()*500+1500;
            document.background_stars[x]['star'].position.y = document.background_stars[x]['y'];
            document.background_stars[x]['x']= Math.random() *window.innerWidth-(window.innerWidth/2);
            document.background_stars[x]['star'].position.x = document.background_stars[x]['x'];
	    document.background_stars[x]['z']=10000;
	    document.background_stars[x]['star'].position.z = 10000;
//          scene.remove(document.background_stars[x]['star']);                                                                                  
//          document.background_stars =                                                                                                          
//          document.background_stars.splice(x,1);                                                                                               
//          x-=1;                                                                                                                                
            document.impurities+=1;
            if(document.impurities>=5){
                YouLose();
            }
            continue;
        }
// Fire                                                                                                                                  
        if(document.background_stars[x]['star'].position.y < window.innerHeight &&
            Math.random() * 1000 < document.en_bullet_chance){
            NewBullet(document.background_stars[x]['star'].position.x,
                      document.background_stars[x]['star'].position.y,
                      document.background_stars[x]['star'].position.z);
}
    }

    document.background_stars.sort(function(a, b) {
        return parseFloat(a['x']) - parseFloat(b['x']);
    });

}
function StartExplosion(posx, posy, posz, big){
    min_time=100;
    min_time_index=-1;
    for(x=0;x<document.lights.length; x+=1){
	if(document.lights[x]['timer']==0){
	    min_time_index=x;
	    break;
	}
	else if(document.lights[x]['timer'] < min_time){
	    min_time = document.lights[x]['timer'];
	    min_time_index = x;
	}
    }
    if(min_time_index == -1)
	return;
    x = min_time_index;
    if(big==1){
	document.lights[x]['timer']=30;
	document.lights[x]['light'].intensity=5.;
    }
    else if (big==0){
	document.lights[x]['timer']=5;
	document.lights[x]['light'].intensity=1.;
    }
    document.lights[x]['light'].position.x=posx;
    document.lights[x]['light'].position.y=posy;
    document.lights[x]['light'].position.z=posz;

}

function light_animation()
{
    for(x=0;x<document.lights.length;x+=1){
	if(document.lights[x]['timer'] <= 0)
	    continue;
	document.lights[x]['timer']-=1;
	if(document.lights[x]['timer']==15)
	    document.lights[x]['light'].intensity=3.;
	if(document.lights[x]['timer']==12)
	    document.lights[x]['light'].intensity=2.5;
	if(document.lights[x]['timer']==10)
	    document.lights[x]['light'].intensity=2.;
	if(document.lights[x]['timer']==8)
	    document.lights[x]['light'].intensity=.125;	
	if(document.lights[x]['timer']==5)
	    document.lights[x]['light'].intensity=.5;
	if(document.lights[x]['timer']==3)
	    document.lights[x]['light'].intensity=.25;
	if(document.lights[x]['timer']==1)
	    document.lights[x]['light'].intensity=.1;
	
	
	if(document.lights[x]['timer']<=0){
	    document.lights[x]['light'].intensity=0.;
	    //scene.remove(document.lights[x]['light']);
	    //document.lights.splice(x,1);
	    //x-=1;
	}
    }
}
function generateSprite() {
    var canvas = document.createElement( 'canvas' );
    canvas.width = 16;
    canvas.height = 16;
    var context = canvas.getContext( '2d' );
    var gradient = context.createRadialGradient( canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2 );
    gradient.addColorStop( 0, 'rgba(255,255,255,1)' );
    gradient.addColorStop( 0.4, 'rgba(0,255,255,.6)' );
    gradient.addColorStop( 0.6, 'rgba(0,0,64,.3)' );
    gradient.addColorStop( 1, 'rgba(0,0,64,0.0)' );
    context.fillStyle = gradient;
    context.fillRect( 0, 0, canvas.width, canvas.height );
    return canvas;
    }
function MakePhotonAnimation(posx, posy, posz, big){
    
    var sm =0.1;
    if(big == 1)
	sm=0.25;
    var photons = new THREE.Geometry();
    if(big!=2)
	exp_photons = document.exp_photons;
    else 
	exp_photons = document.misslePhotons;
    for ( z=0; z<exp_photons; z++ ){
	if(big==0 && z>5)
	    break;
        //attributes.alpha.value[ x ] = .1;                             \
                                                                                     
        var particle = new THREE.Vector3( posx, posy, posz);
	if(big!=2)
            particle.velocity = new THREE.Vector3( sm*GetV(Math.random()),
						   sm*GetV(Math.random()),
						   Math.abs(sm*GetV(Math.random())) );
	else 
	    particle.velocity = new THREE.Vector3( sm*GetV(Math.random()),
                                                   sm*GetV(Math.random()),
                                                   0);

        photons.vertices.push(particle);
    }
    
    properties = {map: new THREE.CanvasTexture( generateSprite() ),
		  size: 40, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, };//color: document.objcolors[Math.round(Math.random()*document.objcolors.length)]};
    if(!big){
	properties['size']=30;
    }
    material = new THREE.PointsMaterial(properties);
    console.log(material);
    var photon_system = new THREE.ParticleSystem( photons, material );
    photon_system.sortParticles = true;
    scene.add(photon_system);
    if(!big)
	photon_system.phocount=15;
    else
	photon_system.phocount=0;
    photon_doc={
	"system": photon_system, 
	"geometry": photons,
	"big": big
    }
    document.photons.push(photon_doc);
}
function photon_animation(clock_corr){

    for(var l=0; l<document.photons.length; l+=1){
	// Do photon animation                    
        photons = document.photons[l]['geometry'];
	photon_system = document.photons[l]['system'];
	for ( p=0; p<photons.vertices.length; p+=1 ){
            var photon = photons.vertices[p];
	    velocity = new THREE.Vector3(photon.velocity.x*1.5,
					photon.velocity.y*1.5,
					photon.velocity.z*1.5);
            photon.add(velocity);
	    
	    // If on plane with enemies allow chain reactions
	    //var vertex = photon.clone();
	    if(document.photons[l]['big'] && Math.abs(photon.z) < 20){
		for(y=0;y<document.background_stars.length;y+=1){		    		    
		    if(document.background_stars[y]['z']!=0) continue;
		    xdiff = (photon.x -
			     document.background_stars[y]['star'].position.x);
		    if(Math.abs(xdiff) <= document.background_stars[y]['size']*1.25
		       &&
		       Math.abs(photon.y -
				document.background_stars[y]['star'].position.y) < 40){
			//Blow enemy
			BlowStar(y);
			break;
		    }
		}
	    }
	}
	photon_system.phocount+=1;
	if(photon_system.phocount>20){
            scene.remove(photon_system);
	    document.photons.splice(l,1);
	    l-=1;
            continue;
	}
	//photon_system.geometry.__dirtyVertices = true;                 
	photon_system.geometry.verticesNeedUpdate=true;
    }
}

function reset(){
      // Enemy container
      // Stats
    document.frame_count=1;
    if(document.player!=null)
	scene.remove(document.player);
    if(document.playerLight!=null){
	scene.remove(document.playerLight.target);
	scene.remove(document.playerLight);
	if(document.useSpotlight)
	    scene.remove(document.spotLight);
    }
    for(x=0;x<document.background_stars.length;x+=1)
	scene.remove(document.background_stars[x]['star']);
    for(x=0;x<document.bubbles.length;x+=1){
	scene.remove(document.bubbles[x]['inner']);
	scene.remove(document.bubbles[x]['outer']);
    }
    for(x=0;x<document.bullets.length; x+=1)
	scene.remove(document.bullets[x]['bul']);
    for(x=0;x<document.en_bullets.length;x+=1)
	scene.remove(document.en_bullets[x]['bul']);
    for(x=0;x<document.WIMPs.length; x+=1){
	scene.remove(document.WIMPs[x]['obj']);
//	scene.remove(document.WIMPs[x]['light']);
    }
    for(x=0;x<document.lights.length; x+=1){
	scene.remove(document.lights[x]['light']);
    }
    for(x=0;x<document.planes.length;x+=1){
	scene.remove(document.planes[x]);
    }
    for(x=0;x<document.background_sprites.length;x+=1){
        scene.remove(document.background_sprites[x]);
    }

    document.background_sprites=[];
    document.bubbles = [];
    document.lights=[];
    document.player=null;
    document.playerLight=null;
    document.en_bullet_speed=10;
      document.max_enemy_size=40;
      document.min_enemy_size=30;
      document.player_x=0;
      document.player_y = 0;
      document.background_stars=[];
//      document.n_stars=20;
document.n_stars=15;
      document.bullets = [];
      document.score=0;
      document.exp_photons=40;
      document.ldown=false;
      document.rdown=false;
      document.udown=false;
    document.wantposx = null;
    document.wantposy = null;
      document.impurities=0;
      document.ddown=false;
      document.en_bullet_chance=10; // 1-1000, rand()*1000 < num
//    document.objcolors = [0xFF0FFF, 0xCCFF00, 0xFF000F, 0x996600, 0xFFFFFF];
    document.objcolors=[ 0xaa8811, 0x33aa33, 0x3388aa, 0xaa3333];
//    document.objcolors=[ 0xfff607, 0x07ff70, 0x0782ff, 0xff0707];
    document.expcolors=[ 0xffffff, 0xfff607, 0x07ff70, 0x0782ff, 0xff0707, 0xffffff];

    document.bubble_colors = [0xff0303, 0x8400ff, 0x00fff6, 0x0028ff, 0x00ff28];
    document.bubble_colors_outer = [0xff0303, 0x8400ff, 0x00fff6, 0x0028ff, 0x00ff28];
    //Planes
    document.useGrid=false;
    document.planes = [];
    document.plane_speed=8;
    document.sound5k = false;
    document.sound15k = false;
    document.sound30k = false;

    //bubbles
    document.bubble_speed = 15;
    document.max_bubbles = 50;

    // sprites
    document.background_sprite_speed=1;
    document.max_background_sprites=100;

    // WIMPs
    document.WIMPs=[];
    document.max_WIMPs=40;
    document.WIMP_speed = 10;
    document.WIMP_min_speed=1;
    document.WIMP_size=50;
    document.WIMP_chance=100;//50;
    document.WIMPwobble=false;
    document.clock_corr=70;
    document.cameraFollow=false;
    document.powerWeaponCharge=0;
    document.misslePhotons=50;
    document.missles=0;
    document.play_power_up=false;
    //document.objcolors=[0xFFFFFF];
    document.useSpotlight=false;

}

function draw_simple_cylinder(scene, camera, renderer, callback, geo_path){
    InitializeGrids();
    document.enemyGeoPath = geo_path;
        loader = new THREE.JSONLoader();

    if(document.useSpotlight){
	var slgeometry = new THREE.CylinderGeometry(0.0, 250, 700, 48*2, 40, true);
	slgeometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, -slgeometry.parameters.height/2, 0 ) );
	slgeometry.applyMatrix( new THREE.Matrix4().makeRotationX( -Math.PI / 2 ) );
	var slmaterial = new THREEx.VolumetricSpotLightMaterial();
	//var slmaterial = new THREE.MeshBasicMaterial();
	document.spotLight  = new THREE.Mesh(slgeometry, slmaterial);
	document.spotLight.position.set(0, 0, 0);
	document.spotLight.lookAt(new THREE.Vector3(0,500, 0));
	
	
	slmaterial.uniforms.lightColor.value.set('white');
	slmaterial.uniforms.attenuation.value =250;
	slmaterial.uniforms.attenuation2.value =500;

	
	slmaterial.uniforms.spotPosition.value= document.spotLight.position;
	slmaterial.uniforms.anglePower.value =1;
	
	scene.add(document.spotLight);
    }

    document.playerLight = new THREE.SpotLight( 0xffffff, 5., 0., Math.PI/2 );
    //document.playerLight.target = (0, 10, 0);
    scene.add( document.playerLight.target );

    document.playerLight.position.set( 0, 0, 0 );
    //document.playerLight.castShadow=true;
    document.playerLight.target.position.set( 0, 10, 0 );
    
    scene.add( document.playerLight );
    document.player = new THREE.Mesh(new THREE.CylinderGeometry(0,10,20),
                            new THREE.MeshBasicMaterial(
				{ wireframe: true } ));
    document.player.position.set(0, 0, 0);
    scene.add(document.player);
    document.player.position.y = document.player_y;
    while(document.lights.length < 15){
	light_color = document.expcolors[Math.floor(Math.random()*document.expcolors.length)];
	if(document.lights.length < document.expcolors.length)
	    light_color = document.expcolors[document.lights.length];
	
	// For all blue
	light_color = 0x2222aa;

	scene_light = new THREE.PointLight( light_color, 0.,0. );	
	scene.add(scene_light);
	document.lights.push({"timer": 0, "light": scene_light});
    }
    while(document.WIMPs.length < document.max_WIMPs){
        SpawnWIMP();
    }

    loader.load( geo_path, function(geometry, materials){
	document.enemyGeometry = geometry;
	document.enemyMaterials = materials;	
	callback();
    });

}



