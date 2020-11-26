import { AfterViewInit, Component, ComponentRef, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { WebcamComponent, WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
import { ElementRef } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { Lightbox, LightboxEvent } from 'ngx-lightbox';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  // toggle webcam on/off
  public showWebcam = true;
  public allowCameraSwitch = true;
  public multipleWebcamsAvailable = false;
  public deviceId: string;
  cameraContainerSize = {
    width: '200',
    height: '200'
  }

  @ViewChild('webcamContainer') webcamContainer: ElementRef<HTMLElement>;
  @ViewChild('webcam') webcam: WebcamComponent;

  public videoOptions: MediaTrackConstraints = {
    // width: {ideal: 1024},
    // height: {ideal: 576}
  };
  public errors: {deviceId: string, error: WebcamInitError}[] = [];

  // latest snapshot
  public webcamImages: {src, caption, thumb, mirrored}[] = [];

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();
  // switch to next / previous / specific webcam; true/false: forward/backwards, string: deviceId
  private nextWebcam: Subject<boolean | string> = new Subject<boolean | string>();
  private mediaDevices: MediaDeviceInfo[] = [];

  constructor(private lightbox: Lightbox, private lightboxEvent: LightboxEvent) {}

  public ngOnInit(): void {
    WebcamUtil.getAvailableVideoInputs()
      .then((mediaDevices: MediaDeviceInfo[]) => {
        this.mediaDevices = mediaDevices;
        this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
      });

      this.onResize({target : window });

    this.lightboxEvent.lightboxEvent$
      .subscribe(event => {
        let a = event;
        let b = this.lightbox;
      });
  }

  ngAfterViewInit() {
    
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
  }

  public handleInitError(error: WebcamInitError): void {
    this.errors.unshift({ deviceId: this.deviceId, error });
  }

  public showNextWebcam(directionOrDeviceId: boolean | string): void {
    // true => move forward through devices
    // false => move backwards through devices
    // string => move to device with given deviceId
    if (this.deviceId) {
      let idx = this.mediaDevices.findIndex(x => x.deviceId == this.deviceId);
      if (idx == this.mediaDevices.length - 1) {
        this.deviceId = this.mediaDevices[0].deviceId;
        this.nextWebcam.next(this.mediaDevices[0].deviceId);
        return;
      }
      else {
        this.deviceId = this.mediaDevices[idx + 1].deviceId;
      }
    }

    this.nextWebcam.next(directionOrDeviceId);
  }

  public handleImage(webcamImage: WebcamImage): void {
    console.info('received webcam image', webcamImage);
    this.webcamImages.unshift({
      src: webcamImage.imageAsDataUrl,
      thumb: webcamImage.imageAsDataUrl,
      mirrored: (<any>(this.webcam)).isMirrorImage(), // it's a private function
      caption: ''
    });
  }

  public cameraWasSwitched(deviceId: string): void {
    console.log('active device: ' + deviceId);
    this.deviceId = deviceId;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean | string> {
    return this.nextWebcam.asObservable();
  }

  @HostListener('window:resize', ['$event'])
  onResize(container) {    
    this.cameraContainerSize = {
      width: container.target.innerWidth,
      height: container.target.innerHeight
    }
  }

  open(sources, index: number): void {
    // open lightbox
    this.lightbox.open(sources, index);
  }
}
