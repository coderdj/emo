function new_scene(div_name){
    renderer = new THREE.WebGLRenderer({blending: THREE.AdditiveBlending,
					alpha: true});
    renderer.setClearColor(0x000000, 1);    
    var width = window.innerWidth;
    var height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(90, width/height, .1, 10000);
    scene = new THREE.Scene();
    scene.add(camera);

    camera.position.z = 500;
    camera.position.y = height/2;//375;
    camera.position.x = 0;

    var ambient_light = new THREE.AmbientLight(0x313131, 1.);
    scene.add(ambient_light);

    var scene_light = new THREE.PointLight( 0x5992c2, .5, 0. );
    document.scene_light2 = new THREE.PointLight( 0xff3333, 1.5, 0. );
    var scene_light3 = new THREE.PointLight( 0x5992c2, .5, 0. );

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

    scene.add(scene_light);    
//    scene.add(document.scene_light2);
//    scene.add(scene_light3);

    document.clock = new THREE.Clock();
    document.clock.start();
    renderer.setSize(width, height);

    document.lights=[];
    document.player=null;
    document.background_stars=[];
    document.WIMPs = [];
    document.en_bullets=[];
    document.bullets=[];
    document.photons=[];
    document.left_bound = -(window.innerWidth/2)-100;
    document.right_bound = (window.innerWidth/2)+100;
    
    var geometry = new THREE.PlaneGeometry( 5000, 5000, 100, 100 );
    for (var i = 0, l = geometry.vertices.length; i < l; i++) {
	geometry.vertices[i].z = Math.random()*300-800;
    }
    console.log(geometry.vertices);
    var material = new THREE.MeshLambertMaterial( {color: 0x003333} );
    document.plane = new THREE.Mesh( geometry, material );
    //document.plane.position.z=-500;
    //scene.add( document.plane );

    
    $("#" + div_name).append(renderer.domElement);
    
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

$(document).on("keydown", function (e) {

    if(e.which == 87)
	document.udown=true;
    else if(e.which == 83)
	document.ddown=true;
    else if(e.which == 65)
	document.ldown=true;
    else if(e.which == 68)
	document.rdown=true;
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
function FireBullet(n){
    bullet = new THREE.Mesh(new THREE.SphereGeometry(5,1,1),                     
                            new THREE.MeshBasicMaterial(                  
                                {color: 0xff0000}));    
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

    if(e.which == 87)
	document.udown=false;
    else if(e.which == 83)
	document.ddown=false;
    else if(e.which == 65)
	document.ldown=false;
    else if(e.which == 68)
	document.rdown=false;
    else if(e.which == 13){
	FireBullet(0);
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
    if(document.autofire == false) return;
    if(document.run_animation==false) return;

    autofire_rate = 250; // base rate
    if(document.score > 2500) autofire_rate-=50;
    if(document.score > 5000) autofire_rate-=50;
    if(document.score > 7500) autofire_rate-=50;
    if(document.score > 10000) autofire_rate-=50;
    if(document.score > 20000) autofire_rate-=25;
    bullet = new THREE.Mesh(new THREE.SphereGeometry(5,1,1),
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
    }
    setTimeout(fire, autofire_rate);
}


function NewBullet(x, y, z){

    bullet = new THREE.Mesh(new THREE.SphereGeometry(5,1,1),
                                     new THREE.MeshBasicMaterial(
                                         {color: 0xffffff}));
/*    var map = document.SPRITE_MAP;
    var material = new THREE.SpriteMaterial( { map: map, color: 0xffffff, fog: true } );
    var bullet = new THREE.Sprite( material );*/
    document.en_bullets.push(bullet);
    scene.add(bullet);
    bullet.position.x = x;
    bullet.position.y = y;
    bullet.position.z = z;

}  

function SpawnWIMP(){

    var size = Math.random()*document.WIMP_size + 20;
size = 50;
    var sign=-1;
    if(Math.random() > .5)
	sign=1;
    new_WIMP =
        { 'x': Math.random() *window.innerWidth-(window.innerWidth/2),
	  'z': (Math.random() * 200 + 150) * sign,     
          'y': 1500,
          'obj': new THREE.Mesh(new THREE.SphereGeometry(size, 12, 12),
                                 new THREE.MeshLambertMaterial({
                                     color: 0x5992c2,
				 })),
	  'wobble':-1,
	  'speed': 1,//Math.random() *document.WIMP_speed + document.WIMP_min_speed,
	};

//    var WIMP_light = new THREE.PointLight( 0xffffff, 10., 50. );
//    scene.add(WIMP_light);
    scene.add(new_WIMP['obj']);
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

    // movement
    var msize=15;
    if(document.udown && document.player.position.y < window.innerHeight)
	document.player.position.y += msize*clock_corr;
    if(document.ddown && document.player.position.y>0)
	document.player.position.y -=msize*clock_corr;
    if(document.ldown && document.player.position.x > document.left_bound)
	document.player.position.x -=msize*clock_corr;
    if(document.rdown && document.player.position.x < document.right_bound)
	document.player.position.x += msize*clock_corr;

    if(document.frame_count%1==0){
//	AnimateBackgroundBoxes();
	document.frame_count=0;
    }
    document.frame_count+=1;
    // Make WIMPs
    if(document.WIMPs.length < document.max_WIMPs && Math.random()*10000 < document.WIMP_chance){
	SpawnWIMP();
    }
    for(x=0;x<document.WIMPs.length; x+=1){
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
	if(document.WIMPs[x]['obj'].position.y < -500){

//	    scene.remove(document.WIMPs[x]['obj']);
	    var sign=-1;
	    if(Math.random() > .5)
		sign=1;

	    document.WIMPs[x]['obj'].position.x = Math.random() *window.innerWidth-(window.innerWidth/2);
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

    document.background_stars.sort(function(a, b) {
        return parseFloat(a['x']) - parseFloat(b['x']);
    });

    // Now check bullets
    var star_start=0;
    for(x=0;x<document.bullets.length; x+=1){
	
	// Propagate bullet
	document.bullets[x]['bul'].position.y+=clock_corr*20;
	
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
		    document.background_stars[y]['star'].material.color.setHex(document.objcolors[document.background_stars[y]['hit']]);
		    break;
		}


		// EXPLODE
		//var orbTex = new THREE.Texture(orb);
		//orbTex.wrapS = THREE.RepeatWrapping;
		//orbTex.wrapT = THREE.RepeatWrapping;
		//orbTex.repeat.x = orbTex.repeat.y = 32;
		//orbTex.needsUpdate = true;
		//document.getElementById(document.dest_0).pause();
		posx = document.background_stars[y]['star'].position.x;
		posy = document.background_stars[y]['star'].position.y;
		posz = document.background_stars[y]['star'].position.z;



		if(document.sound){
		    document.getElementById(document.dest_0).volume=1;
		    document.getElementById(document.dest_0).currentTime=0;
		    document.getElementById(document.dest_0).play();
		}
		
		score_before = Math.floor(document.score/2500);
		document.score += Math.round(50*(1/(document.background_stars[y]['size']/(document.min_enemy_size +
									       ((document.max_enemy_size -
										 document.min_enemy_size)/2)))));
		score_after = Math.floor(document.score/2500);
		if(score_after>score_before && document.impurities>0)
		    document.impurities-=1;
		rand = Math.floor(Math.random()*document.objcolors.length);
		document.background_stars[y]['hit'] = rand;
		document.background_stars[y]['star'].material.color.setHex
		(document.objcolors[document.background_stars[y]['hit']]);
		
		document.background_stars[y]['y'] = Math.random()*500+1500;
		document.background_stars[y]['star'].position.y = document.background_stars[y]['y'];
		document.background_stars[y]['x']= .8*(Math.random() *window.innerWidth-(window.innerWidth/2));
		document.background_stars[y]['star'].position.x = document.background_stars[y]['x'];
		MakePhotonAnimation(posx, posy, posz);

		scene_light = new THREE.PointLight( 0xffffff, 6.,0 );
		scene.add(scene_light);
		scene_light.position.x=posx;
		scene_light.position.y=posy;
		scene_light.position.z=posz;
		light = {"timer": 30, "light": scene_light};
		document.lights.push(light);
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
    renderer.render(scene, camera);
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
    for(i=0;i<6;i+=1){
	console.log("a");
    }
}
function ProcessEnemies(clock_corr)
{    
    if(document.background_stars.length < document.n_stars +
       Math.round(document.score/2000)){
        size = Math.random()*(document.max_enemy_size-document.min_enemy_size)
            + document.min_enemy_size;
        rand = Math.floor(Math.random()*document.objcolors.length);
        new_star =
            { 'x': .8*(Math.random() *window.innerWidth-(window.innerWidth/2)),
              'z': 0,//Math.random() * 50,                                                                                                       
              'y': Math.random() * 1000 + 1000,
              'hit': rand,
              'star': new THREE.Mesh(new THREE.BoxGeometry(size,
                                                           size,
                                                           size),
                                     new THREE.MeshLambertMaterial(
                                         {wireframe: false,
                                          color: document.objcolors[rand]})),
//                                        [Math.round(Math.random() *                                                                            
//                                                    document.objcolors.length)]}))                                                             
            };
	scene.add(new_star['star']);
        new_star['star'].position.x = new_star['x'];
        new_star['star'].position.y = new_star['y'];
	new_star['star'].position.z = new_star['z'];
        new_star['size']=size;
        new_star['xoff']=0;
        new_star['rotax'] = new THREE.Vector3(Math.random(),Math.random(),
					                                            Math.random());
        new_star['xofflim']=Math.random()*300+50;
        new_star['xoffdir']=-1;
	new_star['xoffstep']=Math.random()*5;
	//document.background_stars.push(new_star);                                                                                              
        document.background_stars = insert(new_star,
                                           document.background_stars, 'x');
    }

      // Star movement                                                                                                                             
    for(x=0; x<document.background_stars.length; x+=1){

        //do x jitter                                                                                                                            
	star = document.background_stars[x];
        star['xoff']+=clock_corr*(star['xoffstep']*star['xoffdir']);
        rotateAroundObjectAxis(star['star'], star['rotax'], .05);//50.);//Math.PI / 180);                                                        

        if(Math.abs(star['xoff'])>star['xofflim']) star['xoffdir']*=-1;
        if(star['star'].position.x < .95*document.left_bound)
            star['xoffdir'] = 1;
        if(star['star'].position.x > .95*document.right_bound)
            star['xoffdir']=-1;
        star['star'].position.x = star['x']+star['xoff'];

        // Move downwards                                                                                                                        
        document.background_stars[x]['y'] -= clock_corr*((.1*Math.round
                                              (document.score/2000))+.5);
        document.background_stars[x]['star'].position.y =
            document.background_stars[x]['y'];
        if(document.background_stars[x]['y'] < -300){
            document.background_stars[x]['y'] = Math.random()*500+1500;
            document.background_stars[x]['star'].position.y = document.background_stars[x]['y'];
            document.background_stars[x]['x']= Math.random() *window.innerWidth-(window.innerWidth/2);
            document.background_stars[x]['star'].position.x = document.background_stars[x]['x'];

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

function light_animation()
{
    for(x=0;x<document.lights.length;x+=1){
	document.lights[x]['timer']-=1;
	console.log(document.lights[x]['timer']);
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
	    scene.remove(document.lights[x]['light']);
	    document.lights.splice(x,1);
	    x-=1;
	}
    }
}
function MakePhotonAnimation(posx, posy, posz){
    var new_photon = {};
    var photons = new THREE.Geometry();
    for ( z=0; z<document.exp_photons; z++ ){
        //attributes.alpha.value[ x ] = .1;                             \
                                                                                     
        var particle = new THREE.Vector3( posx, posy, posz);
        particle.velocity = new THREE.Vector3( .25*GetV(Math.random()),
                                               .25*GetV(Math.random()),
                                               Math.abs(.25*GetV(Math.random())) );
        photons.vertices.push(particle);
    }
    
    var material = new THREE.ParticleBasicMaterial( 
	{ size: 7,
          color: document.objcolors[Math.round(Math.random() * 
					       document.objcolors.length)] });
    
/*
  //  var orbTex = new THREE.Texture(orb);                               
//    orbTex.wrapS = THREE.RepeatWrapping;                               
//    orbTex.wrapT = THREE.RepeatWrapping;                               
//    orbTex.repeat.x = orbTex.repeat.y = 32;                            
//    orbTex.needsUpdate = true;               
    uniforms = {
	color:     { type: "c", value: new THREE.Color( 0xffffff ) },
//	texture:   { type: "t", value: orbTex }
    };

    var material = new THREE.ShaderMaterial( {
	uniforms:       uniforms,
	vertexShader:   document.getElementById( 'vertexshader' ).textContent,
	fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
	blending:       THREE.AdditiveBlending,
	depthTest:      false,
	transparent:    true	
	});
*/
    var photon_system = new THREE.ParticleSystem( photons, material );
    photon_system.sortParticles = true;
    scene.add(photon_system);
    photon_system.phocount=0;
    photon_doc={
	"system": photon_system, 
	"geometry": photons
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
	    velocity = new THREE.Vector3(photon.velocity.x+5*Math.random()-2.5,
					photon.velocity.y+5*Math.random()-2.5,
					photon.velocity.z+5*Math.random()-2.5);
            photon.add(velocity);
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
    for(x=0;x<document.background_stars.length;x+=1)
	scene.remove(document.background_stars[x]['star']);
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
    document.lights=[];
    document.player=null;
    document.en_bullet_speed=10;
      document.max_enemy_size=40;
      document.min_enemy_size=15;
      document.player_x=0;
      document.player_y = 0;
      document.background_stars=[];
//      console.log(document.background_stars);
//      document.n_stars=20;
document.n_stars=15;
      document.bullets = [];
      document.score=0;
      document.exp_photons=20;
      document.ldown=false;
      document.rdown=false;
      document.udown=false;
      document.impurities=0;
      document.ddown=false;
      document.en_bullet_chance=10; // 1-1000, rand()*1000 < num
//    document.objcolors = [0xFF0FFF, 0xCCFF00, 0xFF000F, 0x996600, 0xFFFFFF];
    document.objcolors=[ 0xfff607, 0x07ff70, 0x0782ff, 0xff0707];
    // WIMPs
    document.WIMPs=[];
    document.max_WIMPs=15;
    document.WIMP_speed = 10;
    document.WIMP_min_speed=1;
    document.WIMP_size=50;
    document.WIMP_chance=50;
    document.clock_corr=70;
    //document.objcolors=[0xFFFFFF];


}

function draw_simple_cylinder(scene, camera, renderer, callback){

    document.player = new THREE.Mesh(new THREE.CylinderGeometry(10,10,20),
                            new THREE.MeshBasicMaterial(
				{ wireframe: true, opacity: 0.5 } ));
    scene.add(document.player);
    document.player.position.y = document.player_y;
    callback();

}



